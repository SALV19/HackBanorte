import { InferSchemaType, model, Schema } from "mongoose";

// Mensaje persistido para el módulo de chats legado. Se mantiene separado del
// historial Gemini de `Conversacion`, que guarda el intercambio de tools.
const messageSchema = new Schema(
  {
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export type Message = InferSchemaType<typeof messageSchema>;
export const MessageModel = model<Message>("Message", messageSchema);

export const MessageDataAccess = {
  createMessage(content: string) {
    return MessageModel.create({ content });
  },
};
