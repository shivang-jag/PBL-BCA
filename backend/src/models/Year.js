import mongoose from 'mongoose';

const { Schema } = mongoose;

const YearSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    code: { type: String, trim: true, uppercase: true, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

YearSchema.index({ code: 1 }, { unique: true });

export const Year = mongoose.model('Year', YearSchema);
