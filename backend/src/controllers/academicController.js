import mongoose from 'mongoose';
import { Year } from '../models/Year.js';
import { Subject } from '../models/Subject.js';

export async function listYears(req, res) {
  try {
    const years = await Year.find({ isActive: true }).sort({ createdAt: 1 }).lean();
    return res.json({ years });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: 'Failed to list years' });
  }
}

export async function listSubjects(req, res) {
  try {
    const { yearId } = req.query;
    if (!yearId) return res.status(400).json({ message: 'yearId is required' });
    if (!mongoose.isValidObjectId(yearId)) return res.status(400).json({ message: 'Invalid yearId' });

    const subjects = await Subject.find({ year: yearId, isActive: true }).sort({ createdAt: 1 }).lean();
    return res.json({ subjects });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: 'Failed to list subjects' });
  }
}
