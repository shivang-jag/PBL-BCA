import { Message } from '../models/Message.js';
import { Team } from '../models/Team.js';

export async function listMyMessages(req, res) {
  try {
    const email = String(req.user?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Missing user email' });

    const teams = await Team.find({ 'members.email': email }).select('_id').lean();
    const teamIds = teams.map((t) => t._id);
    if (teamIds.length === 0) return res.json({ messages: [] });

    const messages = await Message.find({ teams: { $in: teamIds } })
      .sort({ createdAt: -1 })
      .populate('sender', 'name email')
      .select('sender title content createdAt')
      .lean();

    return res.json({
      messages: (messages || []).map((m) => ({
        _id: m._id,
        senderEmail: m?.sender?.email || '—',
        title: m?.title || '—',
        content: m?.content || '',
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch messages' });
  }
}
