import mongoose from 'mongoose';
import { Team } from '../models/Team.js';
import { Year } from '../models/Year.js';
import { Subject } from '../models/Subject.js';
import { regenerateTeamsSheet } from '../utils/googleSheets.js';

function normalizeMembers(members) {
  const list = Array.isArray(members) ? members : [];
  return list.map((m) => {
    const safe = m && typeof m === 'object' ? m : {};
    return {
      name: String(safe.name || '').trim(),
      email: String(safe.email || '').trim().toLowerCase(),
      rollNumber: String(safe.rollNumber || '').trim().toUpperCase(),
      section: typeof safe.section === 'string' ? safe.section.trim() : '',
      role: safe?.role === 'leader' || Boolean(safe?.isLeader) ? 'leader' : 'member',
    };
  });
}

function compactMembers(normalizedMembers) {
  const list = Array.isArray(normalizedMembers) ? normalizedMembers : [];
  return list.filter((m) => {
    if (m?.role === 'leader') return true;
    return Boolean(m?.name || m?.email || m?.rollNumber);
  });
}

function validateTeamPayload({ teamName, yearId, subjectId, members }, currentUser) {
  if (!teamName || typeof teamName !== 'string' || !teamName.trim()) return 'Team Name is required';
  if (!mongoose.isValidObjectId(yearId)) return 'Invalid yearId';
  if (!mongoose.isValidObjectId(subjectId)) return 'Invalid subjectId';
  if (!Array.isArray(members)) return 'Members are required';

  const normalized = compactMembers(normalizeMembers(members));
  if (normalized.length < 3 || normalized.length > 4) return 'Team must have 3 or 4 members';

  for (const m of normalized) {
    if (!m.name || !m.email || !m.rollNumber) return 'Each member requires name, email, rollNumber';
  }

  const leaders = normalized.filter((m) => m.role === 'leader');
  if (leaders.length !== 1) return 'Exactly 1 leader is required';
  if (leaders[0].email !== String(currentUser.email || '').toLowerCase()) {
    return 'Leader must be the logged-in student';
  }

  const emails = normalized.map((m) => m.email);
  const rolls = normalized.map((m) => m.rollNumber);
  if (new Set(emails).size !== emails.length) return 'Duplicate email detected within team';
  if (new Set(rolls).size !== rolls.length) return 'Duplicate roll number detected within team';

  return null;
}

export async function createTeam(req, res) {
  const { yearId, subjectId, teamName, members } = req.body || {};

  const validationError = validateTeamPayload({ yearId, subjectId, teamName, members }, req.user);
  if (validationError) return res.status(400).json({ message: validationError });

  const year = await Year.findById(yearId).lean();
  if (!year) return res.status(400).json({ message: 'Year not found' });

  const subject = await Subject.findById(subjectId).lean();
  if (!subject) return res.status(400).json({ message: 'Subject not found' });
  if (String(subject.year) !== String(year._id)) {
    return res.status(400).json({ message: 'Subject does not belong to selected year' });
  }

  const normalizedMembers = compactMembers(normalizeMembers(members));
  const emails = normalizedMembers.map((m) => m.email);
  const rolls = normalizedMembers.map((m) => m.rollNumber);

  const existingTeam = await Team.findOne({
    year: yearId,
    subject: subjectId,
    $or: [{ 'members.email': { $in: emails } }, { 'members.rollNumber': { $in: rolls } }],
  }).lean();
  if (existingTeam) return res.status(409).json({ message: 'One or more members are already in another team' });

  try {
    const team = await Team.create({
      year: yearId,
      subject: subjectId,
      teamName: teamName.trim(),
      mentor: { name: '', email: '' },
      createdBy: req.user._id,
      status: 'FINALIZED',
      members: normalizedMembers,
    });

    try {
      await regenerateTeamsSheet();
    } catch {
      // ignore sheet errors
    }

    const sanitized = JSON.parse(JSON.stringify(team));
    if (Array.isArray(sanitized.members)) {
      sanitized.members = sanitized.members.map((m) => {
        const { marks, ...rest } = m;
        return rest;
      });
    }
    return res.status(201).json({ team: sanitized });
  } catch (err) {
    if (String(err?.code) === '11000') {
      return res.status(409).json({ message: 'Duplicate team name or member detected' });
    }
    throw err;
  }
}

export async function myTeam(req, res) {
  const { yearId, subjectId } = req.query;
  if (!yearId || !subjectId) return res.status(400).json({ message: 'yearId and subjectId are required' });
  if (!mongoose.Types.ObjectId.isValid(yearId) || !mongoose.Types.ObjectId.isValid(subjectId)) {
    return res.status(400).json({ message: 'Invalid yearId or subjectId' });
  }

  const team = await Team.findOne({
    year: yearId,
    subject: subjectId,
    'members.email': String(req.user.email || '').toLowerCase(),
  })
    .populate('year', 'name code')
    .populate('subject', 'name code')
    .lean();

  if (!team) return res.json({ team: null });

  // Students should never receive marks field
  if (Array.isArray(team.members)) {
    team.members = team.members.map((m) => {
      const { marks, ...rest } = m;
      return rest;
    });
  }

  return res.json({ team });
}
