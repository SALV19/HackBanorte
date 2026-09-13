import { inputMessageType } from "../types/inputMessage.types";
import { UserDataAccess } from "../model/user.model";
import { messageContent } from "../types/inputMessage.types";
import { AppError } from "../types/error.type";
import runLLM from "../services/llm";
import getUserFinance from "./getUserFinance.usecase";

function determineIntention(content: string) {
  const query = content.toLowerCase();
  if (/pron[oó]stic|proyecci[oó]n|forecast|predec/.test(query)) return "forecast";
  if (/reporte|desglose|categor[ií]a|gast/.test(query)) return "expense_report";
  if (/ingreso|salario|gan[ée]/.test(query)) return "income_consult";
  if (/retiro|pensi[oó]n|ahorro|aportaci[oó]n/.test(query)) return "retirement_consult";
  return "general_consult";
}

async function processMessage(context: inputMessageType) {
  const { content, userName, conversationId } = context;

  const userData = await UserDataAccess.getUserByName(userName);
  console.log("UserData: ", userData);

  if (!userData) {
    const noUserError = new AppError(
      "No se encontró el usuario",
      "USER_NOT_FOUND",
      404,
    );
    throw noUserError;
  }

  const { income, expenses } = await getUserFinance(String(userData._id));
  console.log("IncomeExpeses: ", income, expenses);

  const messageContent: messageContent = {
    // .toObject() porque userData es un Document de Mongoose: sin esto se
    // cuelan internals y age/job llegan undefined al prompt.
    ...userData.toObject(),
    income: income,
    expenses: expenses,
    content,
  };

  const intention = await runLLM(
    messageContent,
    String(userData._id),
    conversationId,
  );
  console.log("Intention-2: ", intention);

  return { ...intention, intention: determineIntention(content) };
}

export default processMessage;
