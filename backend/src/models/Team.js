import mongoose from 'mongoose';

const { Schema } = mongoose;

const MemberSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true },
    rollNumber: { type: String, trim: true, uppercase: true, required: true },
    section: { type: String, trim: true, default: '' },
    role: { type: String, enum: ['leader', 'member'], default: 'member' },
    marks: {
      score: { type: Number, min: 0, max: 100 },
      remarks: { type: String, trim: true, default: '' },
      gradedAt: { type: Date },
      gradedBy: { type: String, trim: true, lowercase: true },
    },
  },
  { _id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

MemberSchema.virtual('isLeader').get(function isLeaderVirtual() {
  return this.role === 'leader';
});

const MentorSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
  },
  { _id: false }
);

const TeamSchema = new Schema(
  {
    year: { type: Schema.Types.ObjectId, ref: 'Year', required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    teamName: { type: String, trim: true, required: true },
    mentor: { type: MentorSchema, default: () => ({}) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['FINALIZED'],
      default: 'FINALIZED',
      required: true,
      get: (v) => (String(v || '').toUpperCase() === 'FROZEN' ? 'FINALIZED' : v),
    },
    members: { type: [MemberSchema], required: true },
  },
  { timestamps: true }
);

// Migrate legacy values safely when a document is saved.
TeamSchema.pre('validate', function migrateLegacyStatus() {
  if (String(this.status || '').toUpperCase() === 'FROZEN') {
    this.status = 'FINALIZED';
  }
});

// Team-level uniqueness
TeamSchema.index({ year: 1, subject: 1, teamName: 1 }, { unique: true });

// Strict cross-team membership rules per (year, subject)
TeamSchema.index({ year: 1, subject: 1, 'members.email': 1 }, { unique: true });
TeamSchema.index({ year: 1, subject: 1, 'members.rollNumber': 1 }, { unique: true });

TeamSchema.pre('save', function validateIntraTeamUniqueness() {
  const members = Array.isArray(this.members) ? this.members : [];
  const emails = members.map((m) => String(m?.email || '').trim().toLowerCase()).filter(Boolean);
  const rolls = members.map((m) => String(m?.rollNumber || '').trim().toUpperCase()).filter(Boolean);

  if (new Set(emails).size !== emails.length) throw new Error('Duplicate member email detected within team');
  if (new Set(rolls).size !== rolls.length) throw new Error('Duplicate member roll number detected within team');
});

export const Team = mongoose.model('Team', TeamSchema);
