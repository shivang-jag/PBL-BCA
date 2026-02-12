import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Year } from '../models/Year.js';
import { Subject } from '../models/Subject.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  await connectDb();

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@pbl.local').trim().toLowerCase();

  await User.updateOne(
    { email: adminEmail, role: 'admin' },
    {
      $setOnInsert: { name: 'Administrator', role: 'admin', email: adminEmail },
    },
    { upsert: true }
  );

  const teacherEmail = (process.env.SEED_TEACHER_EMAIL || 'teacher@pbl.local').trim().toLowerCase();
  const teacherName = (process.env.SEED_TEACHER_NAME || 'Teacher').trim();
  await User.updateOne(
    { email: teacherEmail, role: 'teacher' },
    {
      $setOnInsert: {
        name: teacherName,
        role: 'teacher',
        email: teacherEmail,
      },
    },
    { upsert: true }
  );

  // Years: use only numeric values 1/2/3 (requested).
  // If legacy FY/SY/TY exist, migrate them to 1/2/3 when possible; otherwise deactivate.
  const yearMappings = [
    { legacyCode: 'FY', newCode: '1', newName: '1' },
    { legacyCode: 'SY', newCode: '2', newName: '2' },
    { legacyCode: 'TY', newCode: '3', newName: '3' },
  ];

  for (const m of yearMappings) {
    const numeric = await Year.findOne({ code: m.newCode });
    const legacy = await Year.findOne({ code: m.legacyCode });

    if (!numeric && legacy) {
      await Year.updateOne(
        { _id: legacy._id },
        { $set: { code: m.newCode, name: m.newName, isActive: true } },
        { upsert: false }
      );
      continue;
    }

    if (!numeric) {
      await Year.updateOne(
        { code: m.newCode },
        { $set: { code: m.newCode, name: m.newName, isActive: true } },
        { upsert: true }
      );
    } else {
      await Year.updateOne(
        { _id: numeric._id },
        { $set: { code: m.newCode, name: m.newName, isActive: true } },
        { upsert: false }
      );
    }

    if (legacy) {
      await Year.updateOne({ _id: legacy._id }, { $set: { isActive: false } });
    }
  }

  // Deactivate Final Year if it exists (only 3 years should be active).
  await Year.updateOne({ code: 'LY' }, { $set: { isActive: false } });

  const y1 = await Year.findOne({ code: '1' }).lean();
  const y2 = await Year.findOne({ code: '2' }).lean();
  const y3 = await Year.findOne({ code: '3' }).lean();

  if (!y1) throw new Error("Missing Year with code '1'");
  if (!y2) throw new Error("Missing Year with code '2'");
  if (!y3) throw new Error("Missing Year with code '3'");

  const subjects = [
    { year: y1._id, code: 'SUBJECT1', name: 'Subject1' },
    { year: y1._id, code: 'SUBJECT2', name: 'Subject2' },
    { year: y2._id, code: 'SUBJECT1', name: 'Subject1' },
    { year: y2._id, code: 'SUBJECT2', name: 'Subject2' },
    { year: y3._id, code: 'SUBJECT1', name: 'Subject1' },
    { year: y3._id, code: 'SUBJECT2', name: 'Subject2' },
  ];
  for (const s of subjects) {
    await Subject.updateOne({ year: s.year, code: s.code }, { $set: s }, { upsert: true });
  }

  // Deactivate any other legacy subjects for these years to prevent mismatched sheet mapping.
  await Subject.updateMany(
    {
      year: { $in: [y1._id, y2._id, y3._id] },
      code: { $nin: ['SUBJECT1', 'SUBJECT2'] },
    },
    { $set: { isActive: false } }
  );

  // eslint-disable-next-line no-console
  console.log('Seed complete');
}

await main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
