// Corre `npm run measure-discard-rate -w backend` (usa --env-file=../.env,
// igual que seed/limpiar-cache). Mide, contra la API real, la tasa de
// descarte de backend/a2ui/validate.ts con el responseJsonSchema aflojado
// (ver PASO 2 del plan) usando el system prompt REAL de producción
// (services/prompt.service.ts, con los ejemplos de PASO 5).
//
// Historial de esta medición (ver el plan para el detalle completo):
// - 1er intento (prompt mínimo sin ejemplos, con `id` abierto): timeouts,
//   no representativo.
// - 2do intento (prompt real con ejemplos, TODAVÍA con `id` abierto):
//   4 de 4 casos completados degeneraron en basura/loops de repetición
//   dentro del campo `id`, en el modelo REAL de producción (no el fallback
//   lite) — eso motivó quitarle `id` a Gemini por completo (ver
//   backend/a2ui/assignIds.ts).
// - Esta corrida: primera vez con `id` fuera de la responsabilidad de
//   Gemini. Si el problema era ese campo específico, debería desaparecer.
//
// Por default usa GEMINI_MODEL de .env (el modelo real de producción) — pasa
// TEST_MODEL=otro-modelo si ese está sin cuota.
import { GoogleGenAI } from "@google/genai";
import { buildResponseJsonSchema } from "../a2ui/responseSchema";
import { buildSystemPrompt } from "../services/prompt.service";
import { validateComponents, type DiscardedComponent } from "../a2ui/validate";
import { assignDeterministicIds } from "../a2ui/assignIds";

// Perfil fijo de prueba — el prompt real necesita un `messageContent`, pero
// para esta medición el perfil específico no importa, solo que el prompt
// sea el mismo que se manda en producción.
const PERFIL_PRUEBA = { name: "Prueba", age: 35, job: "Empleado", income: 20000, expenses: 10000, content: "" } as any;

interface CaseResult {
  label: string;
  totalCandidates: number;
  validCount: number;
  discarded: DiscardedComponent[];
}

async function callWithTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout tras ${ms}ms en ${label}`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function runCase(genAI: GoogleGenAI, model: string, systemInstruction: string, label: string, userMessage: string): Promise<CaseResult> {
  const responseJsonSchema = buildResponseJsonSchema();
  const config = {
    systemInstruction,
    responseMimeType: "application/json" as const,
    responseJsonSchema,
    // tope duro de salida: si el modelo entra en un loop de repetición
    // degenerada (visto en vivo con gemini-flash-lite-latest: ~140s y ~80KB
    // de basura repetida en un id), esto acota el daño en vez de dejarlo
    // correr sin límite.
    maxOutputTokens: 4096,
  };

  let res;
  try {
    res = await callWithTimeout(genAI.models.generateContent({ model, contents: userMessage, config }), 45000, label);
  } catch (e) {
    console.log(`  [${label}] primer intento falló (${(e as Error).message.slice(0, 120)}), reintentando en 5s...`);
    await new Promise((r) => setTimeout(r, 5000));
    res = await callWithTimeout(genAI.models.generateContent({ model, contents: userMessage, config }), 45000, label + " (retry)");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(res.text ?? "{}");
  } catch {
    console.log(`  [${label}] RAW TEXT (no parseable, ${(res.text ?? "").length} chars):`, JSON.stringify((res.text ?? "").slice(0, 300)));
    return { label, totalCandidates: 0, validCount: 0, discarded: [{ reason: "respuesta no es JSON válido", kind: "malformado", candidate: res.text }] };
  }

  const candidates = Array.isArray(parsed.componentes) ? parsed.componentes : [];
  // Mismo orden que services/llm.ts: el backend asigna el id antes de
  // validar, Gemini ya no lo produce (ver PASO 5 / backend/a2ui/assignIds.ts).
  const { valid, discarded } = validateComponents(assignDeterministicIds(candidates));
  return { label, totalCandidates: candidates.length, validCount: valid.length, discarded };
}

const CASES: Array<{ label: string; message: string }> = [
  {
    label: "proyeccion_simple",
    message:
      "Quiero saber cuánto tendré ahorrado en 20 años. Datos ya calculados: " +
      "ahorro_actual=50000, aportacion_mensual=800, tasa_anual=0.08, " +
      "anios_restantes=20, saldo_proyectado=380000.",
  },
  {
    label: "comparar_escenarios",
    message:
      "Compara qué pasa si aporto $500 vs $1000 mensuales durante 20 años. " +
      "Escenario A: aportacion_mensual=500, saldo_proyectado=210000. " +
      "Escenario B: aportacion_mensual=1000, saldo_proyectado=380000. " +
      "anios_restantes=20 en ambos.",
  },
  {
    label: "desglose_gastos",
    message: "¿En qué se me va el dinero cada mes? Categorías: renta=8000, comida=4000, transporte=1500, entretenimiento=1000. Total=14500.",
  },
  {
    label: "ajustar_aportacion",
    message: "Ayúdame a ajustar mi aportación mensual al retiro, hoy aporto 800, mi ingreso mensual es 20000.",
  },
  {
    label: "linea_tiempo_retiro",
    message: "¿Cuánto me falta para retirarme? Tengo 35 años, quiero retirarme a los 65.",
  },
  {
    label: "ingreso_mensual",
    message: "Muéstrame mi ingreso mensual actual, que es de 20000 pesos.",
  },
];

async function main() {
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.TEST_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";
  console.log("modelo:", model);
  const systemInstruction = buildSystemPrompt(PERFIL_PRUEBA);
  console.log("system prompt chars:", systemInstruction.length);

  // CASES_FILTER=label1,label2 corre solo esos casos (útil para re-verificar
  // puntualmente los que fallaron en una corrida anterior sin gastar cuota
  // en los que ya salieron limpios).
  const filtro = process.env.CASES_FILTER?.split(",").map((s) => s.trim());
  const casesToRun = filtro ? CASES.filter((c) => filtro.includes(c.label)) : CASES;
  if (filtro) console.log("CASES_FILTER activo, corriendo solo:", casesToRun.map((c) => c.label));

  const results: CaseResult[] = [];
  for (const c of casesToRun) {
    try {
      const result = await runCase(genAI, model, systemInstruction, c.label, c.message);
      results.push(result);
      console.log(`\n[${c.label}] candidatos=${result.totalCandidates} validos=${result.validCount} descartados=${result.discarded.length}`);
      for (const d of result.discarded) {
        const mixedNote = d.mixedFrom?.length ? ` mixedFrom=${d.mixedFrom.join(",")}` : "";
        console.log(`  descartado component=${d.component ?? "?"} id=${d.id ?? "?"} kind=${d.kind}${mixedNote} razon=${d.reason}`);
      }
    } catch (e) {
      console.error(`[${c.label}] ERROR:`, (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  const totalCandidates = results.reduce((sum, r) => sum + r.totalCandidates, 0);
  const totalValid = results.reduce((sum, r) => sum + r.validCount, 0);
  const totalDiscarded = results.reduce((sum, r) => sum + r.discarded.length, 0);
  console.log("\n=== RESUMEN ===");
  console.log(`total candidatos: ${totalCandidates}, validos: ${totalValid}, descartados: ${totalDiscarded}`);
  console.log(`tasa de descarte: ${totalCandidates ? ((totalDiscarded / totalCandidates) * 100).toFixed(1) : "n/a"}%`);

  // Desglose por kind — el riesgo real a vigilar es "mezcla" (props de OTRO
  // componente coladas por el schema fusionado, ver PASO 5 en el plan), no
  // solo la tasa de descarte total.
  const kindCounts = new Map<string, number>();
  for (const r of results) {
    for (const d of r.discarded) {
      kindCounts.set(d.kind, (kindCounts.get(d.kind) ?? 0) + 1);
    }
  }
  console.log("\ndescartes por kind:");
  for (const [kind, count] of kindCounts) {
    const pct = totalCandidates ? ((count / totalCandidates) * 100).toFixed(1) : "n/a";
    console.log(`  ${kind}: ${count} (${pct}% del total de candidatos)`);
  }

  const reasonCounts = new Map<string, number>();
  for (const r of results) {
    for (const d of r.discarded) {
      const mixedNote = d.mixedFrom?.length ? ` [mixedFrom=${d.mixedFrom.join(",")}]` : "";
      const key = `${d.component ?? "?"} (${d.kind}${mixedNote}): ${d.reason}`;
      reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1);
    }
  }
  console.log("\nrazones de descarte (detalle):");
  for (const [key, count] of reasonCounts) {
    console.log(`  (${count}x) ${key}`);
  }
}

main().catch((e) => console.error("FATAL:", e));
