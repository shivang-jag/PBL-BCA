import mongoose from 'mongoose';

const { Schema } = mongoose;

const SettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', SettingSchema);
