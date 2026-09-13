// services/llm.ts
//
// Genera la interfaz declarativa (A2UI) con Gemini en dos fases:
//
//   Fase A — llamada con las tools MCP montadas vía `mcpToTool()`. El SDK corre
//            el loop de function calling solo (pide tool → la ejecuta contra el
//            servidor MCP → le regresa el resultado al modelo) y devuelve el
//            historial completo en `automaticFunctionCallingHistory`.
//   Fase B — llamada final SIN tools, forzando `responseJsonSchema` para que la
//            salida cumpla el schema A2UI sí o sí.
import "dotenv/config";
import { GoogleGenAI, mcpToTool } from "@google/genai";
import type { Content } from "@google/genai";
import { messageContent } from "../types/inputMessage.types";
import { AppError } from "../types/error.type";
import { getMcpClient } from "./mcpClient";
import {
  a2uiSchema,
  a2uiJsonSchema,
  type A2uiResponse,
} from "../views/a2ui.schema";
import { Conversacion } from "../model/Conversacion";
import { runAgent } from "../mcp/orchestrator";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Falta GEMINI_API_KEY en .env");

const genAI = new GoogleGenAI({ apiKey });

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

type ConversacionDoc = InstanceType<typeof Conversacion>;

// El .d.ts de @google/genai resuelve `Client` al build ESM del SDK de MCP,
// mientras que este proyecto (CommonJS) resuelve al build CJS. TS las ve como
// declaraciones distintas por un campo privado, pero en runtime da igual: el
// bundle CJS de genai ni siquiera importa el SDK de MCP, solo llama
// `listTools()` / `callTool()` sobre lo que le pases. El cast salva esa
// diferencia puramente de tipos.
type ClienteMcpParaGenai = Parameters<typeof mcpToTool>[0];

function buildSystemPrompt(
  context: messageContent,
  financialData: unknown,
): string {
  return `
Eres un agente de atención al cliente en un banco, especializado en decisiones de
retiro y pensión. Atiendes a una persona de ${context.age} años que trabaja de
${context.job}, gana ${context.income} pesos al mes y gasta ${context.expenses}
pesos al mes. Usa ese perfil para aterrizar tus recomendaciones; no se lo repitas
de vuelta como si fuera información nueva.

Usa las tools disponibles para consultar datos o hacer cálculos antes de
responder. Nunca inventes cifras que una tool pueda calcular.

El agente de datos ya obtuvo el siguiente contexto desde MongoDB para ESTE
usuario. Es la única fuente para cifras de ingresos, gastos o predicciones;
no cambies sus valores y no atribuyas datos inexistentes:
${JSON.stringify(financialData)}

Cuando ya tengas la información, describe la interfaz a mostrar usando el
catálogo de componentes:
- "texto": un párrafo de explicación.
- "tarjeta_resultado": una cifra clave con su título.
- "grafica": una serie de puntos (etiqueta + valor) para visualizar una
  proyección.
- "formulario": cuando te falten datos que el usuario debe capturar.
- "opciones": cuando necesites que el usuario elija entre alternativas cerradas
  antes de continuar; incluye la pregunta y una lista de opciones concretas.
- "boton_confirmacion": para cerrar con una acción concreta.

Cada componente lleva un "id" único y corto dentro de la respuesta. Responde
siempre en español.
`.trim();
}

async function generarYGuardar(
  conversacion: ConversacionDoc,
  context: messageContent,
  systemInstruction: string,
): Promise<A2uiResponse> {
  const mcp = getMcpClient();

  const contents: Content[] = [
    ...((conversacion.contents ?? []) as Content[]),
    { role: "user", parts: [{ text: context.content }] },
  ];

  // Fase A: el SDK ejecuta las tools MCP automáticamente.
  const faseA = await genAI.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction,
      tools: [mcpToTool(mcp as unknown as ClienteMcpParaGenai)],
    },
  });

  const historial: Content[] = faseA.automaticFunctionCallingHistory?.length
    ? faseA.automaticFunctionCallingHistory
    : contents;

  // Fase B: sin tools, con la salida forzada al schema A2UI.
  const faseB = await genAI.models.generateContent({
    model: MODEL,
    contents: historial,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema: a2uiJsonSchema,
    },
  });

  const componentes = a2uiSchema.parse(JSON.parse(faseB.text ?? "{}"));

  conversacion.contents = [
    ...historial,
    { role: "model", parts: [{ text: JSON.stringify(componentes) }] },
  ];
  // `contents` es Schema.Types.Mixed: sin markModified, Mongoose puede no
  // detectar el cambio y el historial se pierde silenciosamente.
  conversacion.markModified("contents");
  await conversacion.save();

  return componentes;
}

async function cargarConversacion(
  conversationId?: string,
): Promise<ConversacionDoc> {
  if (!conversationId) {
    return Conversacion.create({ contents: [] });
  }

  let conversacion: ConversacionDoc | null;
  try {
    conversacion = await Conversacion.findById(conversationId);
  } catch {
    // findById lanza CastError si el id no es un ObjectId válido.
    conversacion = null;
  }

  if (!conversacion) {
    throw new AppError(
      "No se encontró la conversación",
      "CONVERSATION_NOT_FOUND",
      404,
    );
  }

  return conversacion;
}

export async function runLLM(
  context: messageContent,
  userId: string,
  conversationId?: string,
): Promise<{ conversationId: string; componentes: A2uiResponse }> {
  // Este loop usa function calling nativo de Gemini. Las funciones reciben el
  // userId únicamente en el servidor; el modelo nunca puede escogerlo.
  console.log("About to call RunAgent: ");
  const financialData = await runAgent(context.content, userId);
  console.log("FinancialData: ", financialData);
  const systemInstruction = buildSystemPrompt(context, financialData);
  console.log("All finished");
  const conversacion = await cargarConversacion(conversationId);
  console.log("All finished");
  const componentes = await generarYGuardar(
    conversacion,
    context,
    systemInstruction,
  );
  console.log("All finished");

  return { conversationId: conversacion.id as string, componentes };
}

export default runLLM;
