import mongoose from 'mongoose';

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    title: {
      type: String,
      trim: true,
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

MessageSchema.index({ teams: 1, createdAt: -1 });

export const Message = mongoose.model('Message', MessageSchema);
