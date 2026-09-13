// services/llm.ts
//
// Genera la interfaz declarativa (A2UI real, v0.9) con Gemini en dos fases:
//
//   Fase A — llamada con las tools MCP montadas vía `mcpToTool()`. El SDK corre
//            el loop de function calling solo (pide tool → la ejecuta contra el
//            servidor MCP → le regresa el resultado al modelo) y devuelve el
//            historial completo en `automaticFunctionCallingHistory`.
//   Fase B — llamada final SIN tools, con responseJsonSchema aflojado (ver
//            backend/a2ui/responseSchema.ts — Gemini rechaza con 400 un
//            schema que enumere las 15 formas de componente). La salida
//            cruda se valida contra el schema REAL de cada componente
//            (backend/a2ui/validate.ts) antes de convertirla en mensajes
//            A2UI reales (backend/a2ui/messages.ts), diferenciados contra lo
//            ya mandado en turnos anteriores (backend/a2ui/diff.ts).
import "dotenv/config";
import { GoogleGenAI, mcpToTool } from "@google/genai";
import type { Content } from "@google/genai";
import type { AnyComponent, A2uiMessage } from "@a2ui/web_core/v0_9";
import { CATALOG_ID } from "@hackbanorte/catalog";
import { messageContent } from "../types/inputMessage.types";
import { AppError } from "../types/error.type";
import { getMcpClient } from "./mcpClient";
import { buildSystemPrompt } from "./prompt.service";
import { buildResponseJsonSchema } from "../a2ui/responseSchema";
import { validateComponents, type DiscardedComponent } from "../a2ui/validate";
import { assignDeterministicIds } from "../a2ui/assignIds";
import { createSurface, updateComponents, updateDataModel } from "../a2ui/messages";
import { diffComponents } from "../a2ui/diff";
import { Conversacion } from "../model/Conversacion";
import { buscarEnCache, guardarEnCache } from "./cache";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Falta GEMINI_API_KEY en .env");

const genAI = new GoogleGenAI({ apiKey });

const geminiModel = process.env.GEMINI_MODEL;
if (!geminiModel) throw new Error("Falta GEMINI_MODEL en .env");
const MODEL: string = geminiModel;

type ConversacionDoc = InstanceType<typeof Conversacion>;

// El .d.ts de @google/genai resuelve `Client` al build ESM del SDK de MCP,
// mientras que este proyecto (CommonJS) resuelve al build CJS. TS las ve como
// declaraciones distintas por un campo privado, pero en runtime da igual: el
// bundle CJS de genai ni siquiera importa el SDK de MCP, solo llama
// `listTools()` / `callTool()` sobre lo que le pases. El cast salva esa
// diferencia puramente de tipos.
type ClienteMcpParaGenai = Parameters<typeof mcpToTool>[0];

type CacheInfo =
  | { esPrimerMensaje: true; embedding: number[] }
  | { esPrimerMensaje: false };

// Lo que efectivamente se cachea/reusa por turno — ya validado, antes de
// convertirse en mensajes A2UI (eso depende del estado del surface, que es
// por conversación, no algo cacheable entre conversaciones distintas).
interface TurnoGenerado {
  mensaje?: string;
  componentes: AnyComponent[];
  dataModel: Record<string, unknown>;
}

export interface A2uiTurnResult {
  conversationId: string;
  mensaje?: string;
  a2uiMessages: A2uiMessage[];
  // Componentes que Gemini propuso pero no pasaron validate.ts — nunca se
  // descartan en silencio (ver PASO 2). Vacío en el caso feliz.
  discarded: DiscardedComponent[];
}

function parseFaseB(text: string): { mensaje?: string; componentesCrudos: unknown[]; dataModel: Record<string, unknown> } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { componentesCrudos: [], dataModel: {} };
  }
  const obj = (parsed ?? {}) as Record<string, unknown>;
  return {
    mensaje: typeof obj.mensaje === "string" ? obj.mensaje : undefined,
    componentesCrudos: Array.isArray(obj.componentes) ? obj.componentes : [],
    dataModel: typeof obj.dataModel === "object" && obj.dataModel !== null ? (obj.dataModel as Record<string, unknown>) : {},
  };
}

// A2uiSurface espera SIEMPRE un componente con id EXACTO "root" como punto
// de entrada del árbol — sin uno, se queda mostrando "[Loading root...]"
// para siempre (visto en vivo en PASO 6: el backend mandaba componentes
// reales y válidos, pero ninguno se llamaba "root", así que nunca se pintó
// nada — esto no lo hubiera encontrado ninguna prueba que no fuera visual).
// backend/a2ui/assignIds.ts asigna ids por nombre de tipo (para que el
// diffing sea estable), nunca "root" — así que aquí se envuelve TODO lo
// validado en un Column sintético con id "root" cuyos children son esos
// componentes. Siempre se envuelve, incluso con un solo componente: si el
// wrapper solo apareciera cuando hay 2+, el id del componente único
// cambiaría de "root" a su nombre real en cuanto apareciera un segundo
// componente en un turno futuro, rompiendo el diffing de ese componente.
function withRootWrapper(components: AnyComponent[]): AnyComponent[] {
  const root = {
    component: "Column",
    id: "root",
    children: components.map((c) => (c as { id?: string }).id).filter((id): id is string => typeof id === "string"),
  } as AnyComponent;
  return [...components, root];
}

// Punto único donde un turno (recién generado O recuperado del cache) se
// convierte en mensajes A2UI y actualiza el estado del surface — así el
// diffing/creación de surface se comporta igual sin importar de dónde vino
// el turno.
//
// `freshSurface` es la bandera de "cliente recién montado" (ver
// types/inputMessage.types.ts): aunque la conversación ya tenga surface,
// hay que tratarla como si el cliente no tuviera nada — reemitir
// createSurface, mandar el data model COMPLETO conocido (no solo lo nuevo
// de este turno) y resetear sentComponents a {} para que el árbol entero se
// re-envíe. Sin esto, un F5 a mitad de conversación deja al cliente con una
// pantalla en blanco: el backend cree que ya mandó todo y solo manda el
// diff, pero el MessageProcessor recién montado no tiene nada.
function finalizarTurno(conversacion: ConversacionDoc, turno: TurnoGenerado, freshSurface: boolean): A2uiMessage[] {
  const surfaceActual = (conversacion.a2uiSurface ?? {}) as {
    surfaceId?: string;
    sentComponents?: Record<string, string>;
    dataModel?: Record<string, unknown>;
  };

  const esSurfaceNuevo = freshSurface || !surfaceActual.surfaceId;
  const surfaceId = surfaceActual.surfaceId ?? (conversacion.id as string);
  const dataModelCompleto = { ...(surfaceActual.dataModel ?? {}), ...turno.dataModel };

  const componentesConRoot = withRootWrapper(turno.componentes);
  const { toSend, nextSentComponents } = diffComponents(componentesConRoot, freshSurface ? {} : surfaceActual.sentComponents ?? {});

  const mensajes: A2uiMessage[] = [];
  if (esSurfaceNuevo) {
    mensajes.push(createSurface(surfaceId, CATALOG_ID));
  }

  if (freshSurface) {
    if (Object.keys(dataModelCompleto).length > 0) {
      mensajes.push(updateDataModel(surfaceId, "/", dataModelCompleto));
    }
  } else {
    for (const [path, value] of Object.entries(turno.dataModel)) {
      mensajes.push(updateDataModel(surfaceId, path, value));
    }
  }

  // updateComponents rechaza un array vacío — nunca llamarlo si no hay nada
  // nuevo/cambiado que mandar.
  if (toSend.length > 0) {
    mensajes.push(updateComponents(surfaceId, toSend));
  }

  conversacion.a2uiSurface = {
    surfaceId,
    sentComponents: nextSentComponents,
    dataModel: dataModelCompleto,
  };
  // a2uiSurface es Mixed: sin markModified, Mongoose puede no detectar el
  // cambio y el estado del surface se pierde silenciosamente.
  conversacion.markModified("a2uiSurface");

  return mensajes;
}

async function generarTurno(
  conversacion: ConversacionDoc,
  context: messageContent,
  systemInstruction: string,
): Promise<{ turno: TurnoGenerado; discarded: DiscardedComponent[] }> {
  const mcp = getMcpClient();

  const contents: Content[] = [...((conversacion.contents ?? []) as Content[]), { role: "user", parts: [{ text: context.content }] }];

  // Fase A: el SDK ejecuta las tools MCP automáticamente.
  const faseA = await genAI.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction,
      tools: [mcpToTool(mcp as unknown as ClienteMcpParaGenai)],
    },
  });

  const historial: Content[] = faseA.automaticFunctionCallingHistory?.length ? faseA.automaticFunctionCallingHistory : contents;

  // Fase B: sin tools, con el responseJsonSchema aflojado (ver
  // backend/a2ui/responseSchema.ts) — ya no le pide un `id` a Gemini (ver
  // backend/a2ui/assignIds.ts, PASO 5: ese campo abierto fue exactamente
  // donde el modelo degeneró 4/4 veces en pruebas reales). maxOutputTokens
  // se deja como red de seguridad adicional, no como el fix principal.
  const faseB = await genAI.models.generateContent({
    model: MODEL,
    contents: historial,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema: buildResponseJsonSchema(),
      maxOutputTokens: 4096,
    },
  });

  const { mensaje, componentesCrudos, dataModel } = parseFaseB(faseB.text ?? "{}");
  // El id lo asigna el backend, nunca Gemini (ver backend/a2ui/assignIds.ts
  // — el campo `id` abierto fue donde el modelo degeneró en las pruebas de
  // PASO 5). Sobrescribe cualquier id que el candidato ya traiga.
  const { valid, discarded } = validateComponents(assignDeterministicIds(componentesCrudos));

  conversacion.contents = [...historial, { role: "model", parts: [{ text: faseB.text ?? "{}" }] }];
  // `contents` es Schema.Types.Mixed: sin markModified, Mongoose puede no
  // detectar el cambio y el historial se pierde silenciosamente.
  conversacion.markModified("contents");

  return { turno: { mensaje, componentes: valid, dataModel }, discarded };
}

async function cargarConversacion(conversationId?: string): Promise<ConversacionDoc> {
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
    throw new AppError("No se encontró la conversación", "CONVERSATION_NOT_FOUND", 404);
  }

  return conversacion;
}

export async function runLLM(context: messageContent, conversationId?: string, freshSurface = false): Promise<A2uiTurnResult> {
  const systemInstruction = buildSystemPrompt(context);
  const conversacion = await cargarConversacion(conversationId);

  const esPrimerMensaje = ((conversacion.contents ?? []) as Content[]).length === 0;

  // El cache semántico solo aplica al primer mensaje: los de seguimiento
  // dependen del historial y no son reutilizables entre conversaciones.
  if (esPrimerMensaje) {
    const { embedding, match } = await buscarEnCache(context.content);

    if (match) {
      const cacheado = match.componentes as { mensaje?: string; componentes: unknown[]; dataModel?: Record<string, unknown> };
      // Se re-valida aunque ya se validó al cachear: si el catálogo cambió
      // desde entonces, un candidato cacheado podría ya no calzar.
      const { valid, discarded } = validateComponents(cacheado.componentes ?? []);

      conversacion.contents = [
        { role: "user", parts: [{ text: context.content }] },
        { role: "model", parts: [{ text: JSON.stringify(cacheado) }] },
      ];
      conversacion.markModified("contents");

      const a2uiMessages = finalizarTurno(
        conversacion,
        {
          mensaje: cacheado.mensaje,
          componentes: valid,
          dataModel: cacheado.dataModel ?? {},
        },
        freshSurface,
      );
      await conversacion.save();

      return { conversationId: conversacion.id as string, mensaje: cacheado.mensaje, a2uiMessages, discarded };
    }

    const { turno, discarded } = await generarTurno(conversacion, context, systemInstruction);
    const a2uiMessages = finalizarTurno(conversacion, turno, freshSurface);
    await conversacion.save();

    await guardarEnCache(context.content, embedding, {
      mensaje: turno.mensaje,
      componentes: turno.componentes,
      dataModel: turno.dataModel,
    });

    return { conversationId: conversacion.id as string, mensaje: turno.mensaje, a2uiMessages, discarded };
  }

  const { turno, discarded } = await generarTurno(conversacion, context, systemInstruction);
  const a2uiMessages = finalizarTurno(conversacion, turno, freshSurface);
  await conversacion.save();

  return { conversationId: conversacion.id as string, mensaje: turno.mensaje, a2uiMessages, discarded };
}

export default runLLM;
