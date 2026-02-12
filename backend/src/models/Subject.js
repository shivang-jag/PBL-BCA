import mongoose from 'mongoose';

const { Schema } = mongoose;

const SubjectSchema = new Schema(
  {
    year: { type: Schema.Types.ObjectId, ref: 'Year', required: true, index: true },
    name: { type: String, trim: true, required: true },
    code: { type: String, trim: true, uppercase: true, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SubjectSchema.index({ year: 1, code: 1 }, { unique: true });

export const Subject = mongoose.model('Subject', SubjectSchema);
