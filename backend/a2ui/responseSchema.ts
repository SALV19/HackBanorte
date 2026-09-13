// Genera el responseJsonSchema de Fase B y los JSON Schema por componente
// para el system prompt (PASO 5) — ambos derivados del manifest de
// catalog/, nunca a mano. Reemplaza a views/a2ui.schema.ts (PASO 3).
//
// HALLAZGO 1 (PASO 2, no anticipado por el spike de PASO 0.5): Gemini
// rechaza con 400 INVALID_ARGUMENT cualquier responseJsonSchema que enumere
// las 15 formas de componente como un array `anyOf` — el umbral real está
// entre 4 y 6 ramas, verificado en vivo, independiente del tamaño en bytes
// y de la forma de cada rama. No hay cifra publicada por Google — la doc
// oficial solo dice "very large or deeply nested schemas may be rejected".
//
// HALLAZGO 2 (PASO 5): un campo string SIN restricción real (`id` primero,
// luego `component` cuando se le quitó `id`) es donde el modelo degenera en
// basura/loops de repetición — 4 de 4 casos en el modelo de producción,
// verificado dos veces. `id` ya no lo produce Gemini en absoluto (lo asigna
// el backend, ver backend/a2ui/assignIds.ts). `component` se restringió a
// un `enum` plano de los 15 nombres — un enum sobre UN campo string es un
// conjunto cerrado de tokens, algo mucho más simple para el decoding
// restringido que ramificar 15 object shapes completos (que es lo que
// falló en el Hallazgo 1) — y sí funcionó: cero degeneración en la prueba.
//
// HALLAZGO 3 (PASO 5): con `component` ya restringido, el modelo dejó de
// agregar las props de dominio (ej. devolvía `{"component":"GoalCard"}` sin
// `titulo`/`montoObjetivo`/etc.), aun con `additionalProperties: true`
// explícito en el schema. La causa parece ser que el decoding restringido
// solo "sabe" de los campos que están declarados en `properties` — texto
// suelto en la description/prompt no alcanza para que el modelo los rellene
// de forma confiable. Por eso `componentes.items` declara las props de LOS
// 15 COMPONENTES FUSIONADAS en un solo objeto plano (todas opcionales salvo
// `component`) — sin usar `anyOf`, así que no choca con el Hallazgo 1.
//
// HALLAZGO 4 (PASO 5): fusionar los 15 con sus tipos REALES
// (CommonSchemas.DynamicString/DynamicNumber/Action, cada uno una unión de
// 2-3 ramas) sigue rechazado con 400 más allá de un puñado de componentes —
// verificado en vivo: 3 componentes (11 props) pasa, 6 componentes (18
// props) falla, AMBOS con Dynamic* real. No es la cantidad de props sueltas
// (ver backend/a2ui/literalize.ts: 35 props LITERALES sí pasan) — es la
// cantidad TOTAL de instancias Dynamic*/Action en el schema, sin importar
// cómo estén organizadas (anyOf de shapes completos, o merge de props
// sueltas). Por eso `componentes.items` usa la versión "solo literal" de
// cada prop (literalize.ts) — `catalog/` no cambia, sigue siendo Dynamic*
// real y es contra ESO que valida backend/a2ui/validate.ts.
//
// RIESGO ABIERTO, no resuelto todavía: con 35 props como hermanos planos sin
// separación estructural, el modelo mezcla props de componentes distintos
// (ej. ContributionSlider apareció con `aportacionMensual`/`saldoProyectado`
// de ContributionBalance) y a veces omite props requeridas. validate.ts
// descarta esos nodos correctamente (nunca llega algo mal formado al
// cliente), pero eso significa una tasa de descarte que puede seguir siendo
// alta — por una razón DISTINTA a la degeneración ya resuelta. Ver el plan
// para las opciones consideradas (catálogo más chico por respuesta vs.
// aceptar el descarte con reintento) — decisión pendiente del usuario.
import { zodToJsonSchema } from "zod-to-json-schema";
import { manifest, z } from "@hackbanorte/catalog";
import { literalizeComponentSchema } from "./literalize";

export interface JsonSchemaObject {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

function wrapWithEnvelope(entry: { name: string; schema: any }) {
  const envelope = z.object({
    component: z.enum([entry.name] as [string, ...string[]]),
  });
  return envelope.merge(entry.schema);
}

let cachedCatalogJsonSchema: JsonSchemaObject | undefined;

// JSON Schema del catálogo completo, para documentar cada componente (con
// su envoltorio {component}) dentro del system prompt (PASO 5). No es lo
// mismo que buildResponseJsonSchema() — este es solo para DOCUMENTACIÓN en
// el prompt (por eso sí puede mostrar cada componente por separado); no se
// usa como responseJsonSchema real (ver Hallazgo 1).
//
// Se convierte TODO en una sola llamada (los 15 como propiedades nombradas
// de un mismo objeto, no una por una) para que zod-to-json-schema detecte
// que CommonSchemas.DynamicString/DynamicNumber/Action es la MISMA instancia
// repetida entre componentes y la deduplique en $defs + $ref — convertir
// cada uno por separado infló esto a 68KB de prompt y provocó timeouts
// reales contra Gemini.
export function buildCatalogJsonSchema(): JsonSchemaObject {
  if (!cachedCatalogJsonSchema) {
    const shape: Record<string, unknown> = {};
    for (const entry of manifest) {
      shape[entry.name] = wrapWithEnvelope(entry);
    }
    const combinedZod = z.object(shape as Record<string, any>);
    // combinedZod as any: misma razón que abajo — union profunda, tsc
    // truena con TS2589 sobre la inferencia genérica.
    const full = zodToJsonSchema(combinedZod as any, { target: "jsonSchema2019-09" }) as JsonSchemaObject;
    delete full.$schema;
    cachedCatalogJsonSchema = full;
  }
  return cachedCatalogJsonSchema;
}

// Fusiona las props de los 15 componentes en UN objeto plano (todas
// opcionales) — ver Hallazgo 3. Los nombres que se repiten entre
// componentes (ej. "accessibility"/"weight" en los básicos, "titulo" en
// GoalCard/ProjectionChart, "action" en ContributionSlider/ActionButton,
// "etiqueta" en varios) usan el mismo tipo subyacente en todo el catálogo —
// verificado a mano al escribir esto; si se agrega un componente nuevo con
// un nombre de prop ya usado pero de OTRO tipo, esta fusión se queda con el
// primero que encuentre y el otro componente quedaría mal documentado aquí
// (aunque validate.ts seguiría exigiendo lo correcto contra el schema real).
function buildMergedComponentSchema() {
  const merged: Record<string, any> = {};
  for (const entry of manifest) {
    // literalizeComponentSchema: colapsa Dynamic*/Action a su forma literal
    // antes de fusionar — ver Hallazgo 4.
    const literalShape = literalizeComponentSchema(entry.schema).shape as Record<string, any>;
    for (const [key, fieldSchema] of Object.entries(literalShape)) {
      if (key in merged) continue;
      merged[key] = fieldSchema.optional();
    }
  }
  return z.object({
    component: z.enum(manifest.map((entry) => entry.name) as [string, ...string[]]),
    ...merged,
  });
}

let cachedResponseJsonSchema: JsonSchemaObject | undefined;

// responseJsonSchema real que ve Gemini en Fase B.
export function buildResponseJsonSchema(): JsonSchemaObject {
  if (!cachedResponseJsonSchema) {
    const envelope = z.object({
      mensaje: z.string().max(500).optional(),
      componentes: z.array(buildMergedComponentSchema()),
      dataModel: z.record(z.string(), z.any()).optional(),
    });
    // envelope as any: misma razón de siempre — unión profunda, TS2589.
    const full = zodToJsonSchema(envelope as any, { target: "jsonSchema2019-09" }) as JsonSchemaObject;
    delete full.$schema;
    cachedResponseJsonSchema = full;
  }
  return cachedResponseJsonSchema;
}
