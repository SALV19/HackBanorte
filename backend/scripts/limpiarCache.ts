import mongoose from "mongoose";
import { PreguntaCache } from "../model/PreguntaCache";

const MONGO_URI = process.env.MONGO_URI;

async function limpiarCache() {
  if (!MONGO_URI) throw new Error("Falta MONGO_URI en .env");
  await mongoose.connect(MONGO_URI);
  const { deletedCount } = await PreguntaCache.deleteMany({});
  console.log(`Se borraron ${deletedCount} documentos de preguntacaches.`);
  await mongoose.disconnect();
}

limpiarCache();
