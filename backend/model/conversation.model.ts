import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
}, { _id: false });

export const ReportConversation = model('ReportConversation', new Schema({
  id_user: { type: Schema.Types.ObjectId, required: true, index: true },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true }));
