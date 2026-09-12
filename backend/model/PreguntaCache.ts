import { Schema, model } from "mongoose";

const preguntaCacheSchema = new Schema(
  {
    pregunta: { type: String, required: true },
    componentes: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export const PreguntaCache = model("PreguntaCache", preguntaCacheSchema);
