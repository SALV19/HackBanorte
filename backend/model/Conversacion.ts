import { Schema, model } from "mongoose";

const conversacionSchema = new Schema(
  {
    // Content[] tal como lo espera la API de Gemini, para poder retomar la
    // conversación entre requests sin reconstruir nada.
    contents: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true },
);

export const Conversacion = model("Conversacion", conversacionSchema);
