import { inputMessageType } from "../types/inputMessage.types";
import { UserDataAccess } from "../model/user.model";
import { messageContent } from "../types/inputMessage.types";
import { AppError } from "../types/error.type";
import runLLM from "../services/llm";

async function processMessage(context: inputMessageType) {
  const { content, userName } = context;

  const userData = await UserDataAccess.getUserByName(userName);

  if (!userData) {
    const noUserError = new AppError(
      "No se encontró el usuario",
      "USER_NOT_FOUND",
      404,
    );
    throw noUserError;
  }

  const messageContent: messageContent = {
    ...userData,
    // TODO
    income: 1000,
    expenses: 200,
    content,
  };

  const intention = await runLLM(messageContent);

  return intention;
}

export default processMessage;
