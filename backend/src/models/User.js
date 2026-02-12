import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student', required: true },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });

export const User = mongoose.model('User', UserSchema);
