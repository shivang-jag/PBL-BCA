import mongoose from 'mongoose';
import { Team } from '../models/Team.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { regenerateTeamsSheet } from '../utils/googleSheets.js';

export async function listAssignedTeams(req, res) {
  try {
    const email = String(req.user.email || '').toLowerCase();
    const teams = await Team.find({ 'mentor.email': email })
      .populate('year', 'name code')
      .populate('subject', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      teams: (teams || []).map((t) => ({
        ...t,
        status: String(t?.status || '').toUpperCase() === 'FROZEN' ? 'FINALIZED' : t?.status,
      })),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAssignedTeam(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid team id' });

  try {
    const email = String(req.user.email || '').toLowerCase();
    const team = await Team.findOne({ _id: id, 'mentor.email': email })
      .populate('year', 'name code')
      .populate('subject', 'name code')
      .lean();

    if (!team) return res.status(404).json({ message: 'Team not found or not assigned' });
    return res.json({
      team: {
        ...team,
        status: String(team?.status || '').toUpperCase() === 'FROZEN' ? 'FINALIZED' : team?.status,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function gradeTeam(req, res) {
  const { teamId, grades } = req.body || {};
  if (!mongoose.isValidObjectId(teamId)) return res.status(400).json({ message: 'Invalid teamId' });
  if (!Array.isArray(grades) || grades.length < 1) return res.status(400).json({ message: 'grades is required' });

  try {
    const teacherEmail = String(req.user.email || '').toLowerCase();
    const team = await Team.findOne({ _id: teamId, 'mentor.email': teacherEmail });
    if (!team) return res.status(404).json({ message: 'Team not found or not assigned' });

    // Legacy migration: older records may still have status=FROZEN.
    if (String(team.status || '').toUpperCase() === 'FROZEN') {
      team.status = 'FINALIZED';
    }

    const now = new Date();
    for (const g of grades) {
      const rollNumber = String(g.rollNumber || '').trim().toUpperCase();
      if (!rollNumber) return res.status(400).json({ message: 'Each grade requires rollNumber' });

      const score = Number(g.score);
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        return res.status(400).json({ message: 'Score must be a number between 0 and 100' });
      }
      const remarks = typeof g.remarks === 'string' ? g.remarks.trim() : '';

      const member = team.members.find(
        (m) => String(m.rollNumber || '').trim().toUpperCase() === rollNumber
      );
      if (!member) return res.status(400).json({ message: `Member not found for rollNumber: ${rollNumber}` });

      member.marks = {
        score,
        remarks,
        gradedAt: now,
        gradedBy: teacherEmail,
      };
    }

    await team.save();

    try {
      await regenerateTeamsSheet();
    } catch {
      // ignore sheet errors
    }

    return res.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function broadcastMessage(req, res) {
  try {
    const senderId = req.user?._id;
    if (!mongoose.isValidObjectId(senderId)) {
      return res.status(401).json({ message: 'Invalid user session' });
    }

    const senderUser = await User.findById(senderId).select('_id email role').lean();
    if (!senderUser) return res.status(401).json({ message: 'User not found' });

    const teacherEmail = String(req.user?.email || senderUser.email || '').trim().toLowerCase();
    if (!teacherEmail) return res.status(400).json({ message: 'Missing teacher email' });

    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const teams = await Team.find({ 'mentor.email': teacherEmail }).select('_id').lean();
    const teamIds = teams.map((t) => t._id);
    if (teamIds.length === 0) {
      return res.status(400).json({ message: 'No assigned teams to broadcast to' });
    }

    const message = await Message.create({
      sender: senderUser._id,
      teams: teamIds,
      title,
      content,
    });

    return res.status(201).json({ ok: true, messageId: message._id, teamsCount: teamIds.length });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: 'Failed to broadcast message' });
  }
}
