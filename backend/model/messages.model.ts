import { model, Schema, Types, Document } from "mongoose";

export interface Message extends Document {
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<Message>(
  {
    content: { type: String, required: true },
  },
  { timestamps: true },
);

export const MessageModel = model<Message>("Message", MessageSchema);

export const MessageDataAccess = {
  createMessage: async (content: string) => {
    return await MessageModel.create({ content });
  },
};
