import mongoose from 'mongoose';
import { Team } from '../models/Team.js';
import { Message } from '../models/Message.js';
import { Setting } from '../models/Setting.js';
import { User } from '../models/User.js';
import { syncMentorsFromSheet, regenerateTeamsSheet } from '../utils/googleSheets.js';

export async function listAllTeams(req, res) {
  try {
    const pageRaw = Number.parseInt(String(req.query.page || '1'), 10);
    const limitRaw = Number.parseInt(String(req.query.limit || '50'), 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;
    const skip = (page - 1) * limit;

    const [total, teams, setting] = await Promise.all([
      Team.countDocuments({}),
      Team.find({})
        .populate('year', 'name code')
        .populate('subject', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Setting.findOne({ key: 'mentorSync' }).lean(),
    ]);

    const lastSyncedAt = setting?.value?.lastSyncedAt || null;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return res.json({
      teams: (teams || []).map((t) => ({
        ...t,
        status: String(t?.status || '').toUpperCase() === 'FROZEN' ? 'FINALIZED' : t?.status,
      })),
      lastSyncedAt,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTeamDetails(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid team id' });
  }

  try {
    const team = await Team.findById(id)
      .populate('year', 'name code')
      .populate('subject', 'name code')
      .populate('createdBy', 'name email')
      .lean();

    if (!team) return res.status(404).json({ message: 'Team not found' });
    return res.json({
      team: {
        ...team,
        status: String(team?.status || '').toUpperCase() === 'FROZEN' ? 'FINALIZED' : team?.status,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function syncMentors(req, res) {
  try {
    const summary = await syncMentorsFromSheet();
    const now = new Date();

    await Setting.updateOne(
      { key: 'mentorSync' },
      { $set: { value: { lastSyncedAt: now.toISOString(), summary } } },
      { upsert: true }
    );

    // Optional: regenerate full sheet after mentor updates to keep sheet consistent.
    try {
      await regenerateTeamsSheet();
    } catch {
      // ignore sheet regen errors
    }

    return res.json({ ...summary, lastSyncedAt: now.toISOString() });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: 'Failed to sync mentors' });
  }
}

export async function listAllMessages(req, res) {
  try {
    const messages = await Message.find({})
      .sort({ createdAt: -1 })
      .populate('sender', 'name email')
      .select('sender title createdAt teams')
      .lean();

    return res.json({
      messages: (messages || []).map((m) => ({
        _id: m._id,
        senderEmail: m?.sender?.email || '—',
        title: m?.title || '—',
        createdAt: m.createdAt,
        teamsCount: Array.isArray(m.teams) ? m.teams.length : 0,
      })),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch messages' });
  }
}

export async function migrateMessageSenders(req, res) {
  try {
    // 1) Backfill missing sender ref from legacy senderEmail
    const legacy = await Message.find({
      $and: [
        { senderEmail: { $type: 'string', $ne: '' } },
        {
          $or: [
            { sender: { $exists: false } },
            { sender: null },
          ],
        },
      ],
    })
      .select('_id senderEmail')
      .lean();

    const emails = Array.from(
      new Set((legacy || []).map((m) => String(m.senderEmail || '').trim().toLowerCase()).filter(Boolean))
    );

    const users = emails.length
      ? await User.find({ email: { $in: emails } }).select('_id email role').lean()
      : [];

    const byEmail = new Map();
    for (const u of users || []) {
      if (u?.email) byEmail.set(String(u.email).toLowerCase(), u);
    }

    let senderBackfilledCount = 0;
    let senderUnresolvedCount = 0;
  const unresolvedSamples = [];

    if (legacy?.length) {
      const ops = [];
      for (const msg of legacy) {
        const email = String(msg.senderEmail || '').trim().toLowerCase();
        const u = byEmail.get(email);
        if (!u?._id) {
          senderUnresolvedCount += 1;
          if (unresolvedSamples.length < 50) {
            unresolvedSamples.push({ messageId: String(msg._id), senderEmail: email });
          }
          continue;
        }
        senderBackfilledCount += 1;
        ops.push({
          updateOne: {
            filter: { _id: msg._id, $or: [{ sender: { $exists: false } }, { sender: null }] },
            update: { $set: { sender: u._id } },
          },
        });
      }

      if (ops.length) {
        await Message.bulkWrite(ops, { ordered: false });
      }
    }

    // 2) Remove senderEmail only where sender exists (avoid losing unresolved legacy emails)
    const unsetFilter = {
      senderEmail: { $exists: true },
      sender: { $type: 'objectId' },
    };
    const unsetResult = await Message.updateMany(
      unsetFilter,
      { $unset: { senderEmail: 1 } },
      { strict: false }
    );

    try {
      const now = new Date();
      await Setting.updateOne(
        { key: 'messageSenderMigration' },
        {
          $set: {
            value: {
              migratedAt: now.toISOString(),
              senderBackfilledCount,
              senderUnresolvedCount,
              unresolvedSamples,
              senderEmailUnsetCount: Number(unsetResult?.modifiedCount || 0),
            },
          },
        },
        { upsert: true }
      );
    } catch {
      // ignore setting write errors
    }

    return res.json({
      ok: true,
      senderBackfilledCount,
      senderUnresolvedCount,
      unresolvedSamples,
      senderEmailUnsetCount: Number(unsetResult?.modifiedCount || 0),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: 'Failed to migrate message senders' });
  }
}

export async function listAllTeachers(req, res) {
  try {
    const teacherLoginEnabled = Boolean(process.env.TEACHER_SECRET && String(process.env.TEACHER_SECRET).trim());

    const teachers = await User.find({ role: 'teacher' })
      .select('name email role createdAt updatedAt')
      .sort({ email: 1 })
      .lean();

    const counts = await Team.aggregate([
      { $match: { 'mentor.email': { $type: 'string', $ne: '' } } },
      { $group: { _id: { $toLower: '$mentor.email' }, assignedTeamsCount: { $sum: 1 } } },
    ]);

    const byEmail = new Map();
    for (const c of counts || []) {
      if (c?._id) byEmail.set(String(c._id).toLowerCase(), Number(c.assignedTeamsCount || 0));
    }

    return res.json({
      teacherLoginEnabled,
      teachers: (teachers || []).map((t) => ({
        _id: t._id,
        name: t.name,
        email: t.email,
        role: t.role,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        assignedTeamsCount: byEmail.get(String(t.email || '').toLowerCase()) || 0,
        canLogin: teacherLoginEnabled,
      })),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch teachers' });
  }
}

function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase();
}

export async function createTeacher(req, res) {
  const email = normalizeEmail(req.body?.email);
  const nameRaw = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const name = nameRaw || 'Teacher';

  if (!email) return res.status(400).json({ message: 'email is required' });

  try {
    // Fast path: update existing teacher (atomic).
    const updatedTeacher = await User.findOneAndUpdate(
      { email, role: 'teacher' },
      { $set: { name } },
      { new: true }
    );

    if (updatedTeacher) {
      return res.status(200).json({
        ok: true,
        teacher: {
          _id: updatedTeacher._id,
          name: updatedTeacher.name,
          email: updatedTeacher.email,
          role: updatedTeacher.role,
          createdAt: updatedTeacher.createdAt,
          updatedAt: updatedTeacher.updatedAt,
        },
      });
    }

    // Otherwise, try creating a new teacher. Handle unique-email races safely.
    try {
      const created = await User.create({ email, role: 'teacher', name });
      return res.status(201).json({
        ok: true,
        teacher: {
          _id: created._id,
          name: created.name,
          email: created.email,
          role: created.role,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      });
    } catch (createErr) {
      if (createErr?.code === 11000) {
        const existing = await User.findOne({ email }).select('role').lean();
        if (existing && existing.role !== 'teacher') {
          return res.status(409).json({ message: 'Email already exists with a different role' });
        }

        const teacher = await User.findOneAndUpdate(
          { email, role: 'teacher' },
          { $set: { name } },
          { new: true }
        );

        if (!teacher) {
          return res.status(500).json({ message: 'Failed to create teacher' });
        }

        return res.status(200).json({
          ok: true,
          teacher: {
            _id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            role: teacher.role,
            createdAt: teacher.createdAt,
            updatedAt: teacher.updatedAt,
          },
        });
      }
      throw createErr;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: 'Failed to create teacher' });
  }
}

export async function migrateTeamStatuses(req, res) {
  try {
    const result = await Team.updateMany(
      { status: 'FROZEN' },
      { $set: { status: 'FINALIZED' } },
      { strict: false }
    );

    try {
      const now = new Date();
      await Setting.updateOne(
        { key: 'teamStatusMigration' },
        {
          $set: {
            value: {
              migratedAt: now.toISOString(),
              matchedCount: Number(result?.matchedCount || 0),
              modifiedCount: Number(result?.modifiedCount || 0),
            },
          },
        },
        { upsert: true }
      );
    } catch {
      // ignore setting write errors
    }

    return res.json({
      ok: true,
      matchedCount: Number(result?.matchedCount || 0),
      modifiedCount: Number(result?.modifiedCount || 0),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: 'Failed to migrate team statuses' });
  }
}
