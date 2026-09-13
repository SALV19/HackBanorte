import { inputMessageType } from "../types/inputMessage.types";
import { UserDataAccess } from "../model/user.model";
import { messageContent } from "../types/inputMessage.types";
import { AppError } from "../types/error.type";
import runLLM from "../services/llm";
import getUserFinance from "./getUserFinance.usecase";

async function processMessage(context: inputMessageType) {
  const { content, userName, conversationId } = context;

  const userData = await UserDataAccess.getUserByName(userName);

  if (!userData) {
    const noUserError = new AppError(
      "No se encontró el usuario",
      "USER_NOT_FOUND",
      404,
    );
    throw noUserError;
  }

  const { income, expenses } = await getUserFinance(String(userData._id));

  const messageContent: messageContent = {
    // .toObject() porque userData es un Document de Mongoose: sin esto se
    // cuelan internals y age/job llegan undefined al prompt.
    ...userData.toObject(),
    income: income,
    expenses: expenses,
    content,
  };

  const intention = await runLLM(messageContent, String(userData._id), conversationId);

  return intention;
}

export default processMessage;
