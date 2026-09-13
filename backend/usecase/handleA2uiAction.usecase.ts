// usecase/handleA2uiAction.usecase.ts
//
// POST /a2ui/action: si action.name está en backend/a2ui/action.registry.ts,
// llama la tool MCP directo y responde solo updateDataModel — nunca
// updateComponents, nunca pasa por Gemini ("route": "deterministic"). Si no
// está registrada, cae al flujo completo de Fase A+B ("route": "llm"),
// sintetizando un mensaje de usuario a partir de la acción.
//
// DECISIÓN DE ALCANCE (no estaba en el plan original, se tomó al escribir
// esto): surfaceId == conversationId, 1:1 fijo (asignado en
// services/llm.ts). Por eso action.surfaceId basta para encontrar la
// conversación sin un campo aparte en el body. Esto asume que cada
// conversación tiene EXACTAMENTE un surface — si en algún momento se
// necesita más de un surface por conversación (ej. dos pantallas A2UI
// independientes en la misma sesión de chat), este supuesto es lo primero
// que hay que romper: haría falta un campo conversationId separado de
// surfaceId, y a2uiSurface en el modelo tendría que dejar de ser un
// subdocumento único (ver model/Conversacion.ts).
import type { A2uiClientAction, A2uiMessage } from "@a2ui/web_core/v0_9";
import { UserDataAccess } from "../model/user.model";
import { Conversacion } from "../model/Conversacion";
import { AppError } from "../types/error.type";
import { actionRegistry } from "../a2ui/action.registry";
import { updateDataModel } from "../a2ui/messages";
import getUserFinance from "./getUserFinance.usecase";
import runLLM from "../services/llm";

export interface HandleA2uiActionInput {
  userName: string;
  action: A2uiClientAction;
}

export interface HandleA2uiActionResult {
  route: "deterministic" | "llm";
  conversationId: string;
  mensaje?: string;
  a2uiMessages: A2uiMessage[];
}

async function manejarRutaDeterministica(action: A2uiClientAction, handler: (typeof actionRegistry)[string]): Promise<HandleA2uiActionResult> {
  const conversationId = action.surfaceId;
  const conversacion = await Conversacion.findById(conversationId);
  if (!conversacion) {
    throw new AppError("No se encontró la conversación", "CONVERSATION_NOT_FOUND", 404);
  }

  const surface = (conversacion.a2uiSurface ?? {}) as {
    surfaceId?: string;
    sentComponents?: Record<string, string>;
    dataModel?: Record<string, unknown>;
  };
  const dataModelActual = surface.dataModel ?? {};

  const nuevosValores = await handler({ context: action.context, dataModel: dataModelActual });

  const a2uiMessages = Object.entries(nuevosValores).map(([path, value]) => updateDataModel(conversationId, path, value));

  conversacion.a2uiSurface = {
    surfaceId: surface.surfaceId ?? conversationId,
    sentComponents: surface.sentComponents ?? {},
    dataModel: { ...dataModelActual, ...nuevosValores },
  };
  conversacion.markModified("a2uiSurface");
  await conversacion.save();

  return { route: "deterministic", conversationId, a2uiMessages };
}

async function manejarRutaLLM(userName: string, action: A2uiClientAction): Promise<HandleA2uiActionResult> {
  const userData = await UserDataAccess.getUserByName(userName);
  if (!userData) {
    throw new AppError("No se encontró el usuario", "USER_NOT_FOUND", 404);
  }

  const { income, expenses } = await getUserFinance(String(userData._id));

  const contenidoSintetico =
    `El usuario interactuó con el componente "${action.sourceComponentId}", ` +
    `disparando la acción "${action.name}" con estos datos: ` +
    `${JSON.stringify(action.context)}. Genera la siguiente pantalla.`;

  const messageContentValue = {
    ...userData.toObject(),
    income,
    expenses,
    content: contenidoSintetico,
  };

  const resultado = await runLLM(messageContentValue, action.surfaceId);

  return {
    route: "llm",
    conversationId: resultado.conversationId,
    mensaje: resultado.mensaje,
    a2uiMessages: resultado.a2uiMessages,
  };
}

async function handleA2uiAction(input: HandleA2uiActionInput): Promise<HandleA2uiActionResult> {
  const { userName, action } = input;
  const handler = actionRegistry[action.name];

  if (handler) {
    return manejarRutaDeterministica(action, handler);
  }

  return manejarRutaLLM(userName, action);
}

export default handleA2uiAction;
