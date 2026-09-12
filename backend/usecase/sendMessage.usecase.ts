import { MessageDataAccess } from "./../model/messages.model";
import { Types } from "mongoose";
import { ChatDataAccess } from "../model/chat.model";

interface CreateNewChatInput {
  userId: string;
  content: string;
}

export const createNewChatUseCase = async ({
  userId,
  content,
}: CreateNewChatInput) => {
  const newMessage = await MessageDataAccess.createMessage(content);

  const newChat = await ChatDataAccess.createChat(
    userId,
    content,
    newMessage._id as Types.ObjectId,
  );

  return newChat;
};
