// services/cache.ts
//
// Cache semántico de respuestas A2UI. Solo aplica al PRIMER mensaje de una
// conversación: se embebe la pregunta y se compara por similitud de coseno
// contra preguntas ya resueltas antes (de cualquier usuario). Si hay match por
// encima del umbral, se reutiliza el A2UI guardado sin llamar a Gemini.
//
// La similitud se calcula en el propio backend (no con `$vectorSearch` de
// Atlas) a propósito, para que funcione igual con Mongo local o Atlas.
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { PreguntaCache } from "../model/PreguntaCache";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const UMBRAL_SIMILITUD = 0.92;

export async function embedTexto(texto: string): Promise<number[]> {
  const res = await genAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: texto,
    config: { taskType: "SEMANTIC_SIMILARITY" },
  });

  const values = res.embeddings?.[0]?.values;
  if (!values) throw new Error("No se pudo generar el embedding.");
  return values;
}

function similitudCoseno(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let punto = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    punto += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  const denominador = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominador === 0) return 0;

  return punto / denominador;
}

export async function buscarEnCache(pregunta: string) {
  const embedding = await embedTexto(pregunta);

  const candidatos = await PreguntaCache.find(
    {},
    { pregunta: 1, embedding: 1, componentes: 1 },
  );

  let mejor: { doc: (typeof candidatos)[number]; score: number } | null = null;

  for (const doc of candidatos) {
    const score = similitudCoseno(embedding, doc.embedding);
    if (score >= UMBRAL_SIMILITUD && (!mejor || score > mejor.score)) {
      mejor = { doc, score };
    }
  }

  if (mejor) {
    console.log(
      `[cache] HIT (${mejor.score.toFixed(4)}) — "${mejor.doc.pregunta}"`,
    );
  } else {
    console.log(`[cache] MISS — "${pregunta}"`);
  }

  return { embedding, match: mejor?.doc ?? null };
}

export async function guardarEnCache(
  pregunta: string,
  embedding: number[],
  componentes: unknown,
) {
  await PreguntaCache.create({ pregunta, embedding, componentes });
}
