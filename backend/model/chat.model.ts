import { model, Schema, Types, Document } from "mongoose";

export interface IChat extends Document {
  userId: Types.ObjectId;
  context: string;
  messages: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    context: { type: String, required: true },
    messages: [{ type: Schema.Types.ObjectId, ref: "Message", default: [] }],
  },
  { timestamps: true },
);

export const ChatModel = model<IChat>("Chat", ChatSchema);

export const ChatDataAccess = {
  getMostRecentChat: async (userId: string) => {
    return await ChatModel.findOne({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .populate("messages")
      .exec();
  },

  createChat: async (
    userId: string,
    context: string,
    initialMessageId: Types.ObjectId,
  ) => {
    return await ChatModel.create({
      userId: new Types.ObjectId(userId),
      context,
      messages: [initialMessageId],
    });
  },

  addMessageToChat: async (chatId: string, messageId: Types.ObjectId) => {
    return await ChatModel.findByIdAndUpdate(
      chatId,
      { $push: { messages: messageId } },
      { new: true },
    ).populate("messages");
  },
};
