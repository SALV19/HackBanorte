import { Schema, model } from "mongoose";

const conversacionSchema = new Schema(
  {
    // Content[] tal como lo espera la API de Gemini, para poder retomar la
    // conversación entre requests sin reconstruir nada.
    contents: { type: Schema.Types.Mixed, default: [] },

    // Estado del surface A2UI — separado a propósito de `contents` (eso es
    // historial de Gemini; esto es protocolo A2UI, no se leen/escriben desde
    // la misma ruta de código). sentComponents es un Record<id, hash> del
    // último payload validado que se mandó por componente (ver
    // backend/a2ui/diff.ts); dataModel es el último data model conocido, para
    // reconstruir args de tools MCP en la ruta determinista de /a2ui/action.
    // Ambos son Mixed: como con `contents`, hay que llamar
    // .markModified("a2uiSurface") al mutarlos en el lugar.
    //
    // Es un subdocumento ÚNICO a propósito: el diseño actual asume 1
    // conversación = 1 surface, y `surfaceId` se fija igual a `_id` de esta
    // misma conversación (ver services/llm.ts y
    // usecase/handleA2uiAction.usecase.ts). Soportar más de un surface por
    // conversación requeriría que esto sea un array/mapa en vez de un
    // objeto único, y separar conversationId de surfaceId en todos los
    // endpoints que hoy asumen que son lo mismo.
    a2uiSurface: {
      surfaceId: { type: String },
      sentComponents: { type: Schema.Types.Mixed, default: {} },
      dataModel: { type: Schema.Types.Mixed, default: {} },
    },
  },
  { timestamps: true },
);

export const Conversacion = model("Conversacion", conversacionSchema);
