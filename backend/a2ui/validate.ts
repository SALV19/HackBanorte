// Gate final antes de mandar cualquier componente al cliente: valida contra
// el schema REAL de catalog/ (con CommonSchemas.DynamicString/Number/Action
// intactos — nunca la vista simplificada que ve Gemini, ver
// backend/a2ui/literalize.ts). Si Gemini alucina un prop, o un componente
// que no existe en el manifest, se descarta aquí y no llega al front.
//
// `component`/`id` son campos de envoltura (AnyComponent), no viven dentro
// del schema propio de cada componente del catálogo — por eso se separan
// antes de validar y se reinsertan después. `weight` (si el componente lo
// define, como los del catálogo base) SÍ es parte del schema y viaja dentro
// de `props`.
//
// Los descartes se clasifican en un `kind` (ver DiscardReason) para poder
// medir por separado si el riesgo real es "Gemini mezcla props de otro
// componente" (posible desde que responseSchema.ts fusiona los 15 en un
// solo objeto plano, ver Hallazgo 4/PASO 5) o "Gemini omitió/typeó mal algo
// que sí era de este componente" — son causas distintas con arreglos
// distintos, y antes caían juntas en el mismo "descartado".
import { manifest } from "@hackbanorte/catalog";
import type { AnyComponent } from "@a2ui/web_core/v0_9";

const schemaByName = new Map(manifest.map((entry) => [entry.name, entry.schema]));

// prop name -> lista de componentes del catálogo que la usan de verdad.
// Sirve para distinguir una prop "mezclada desde otro componente" (aparece
// aquí con OTRO nombre de componente) de una prop inventada que no
// pertenece a nada del catálogo.
const componentsByProp = new Map<string, string[]>();
for (const entry of manifest) {
  const shape = (entry.schema as any).shape as Record<string, unknown>;
  for (const propName of Object.keys(shape)) {
    const list = componentsByProp.get(propName) ?? [];
    list.push(entry.name);
    componentsByProp.set(propName, list);
  }
}

export type DiscardReason =
  | "malformado" // el candidato ni siquiera es un objeto, o 'component'/'id' tienen el tipo incorrecto
  | "componente_desconocido" // 'component' no existe en el manifest
  | "mezcla" // trae una o más props que SÍ pertenecen a OTRO componente del catálogo
  | "prop_no_reconocida" // trae una o más props que no pertenecen a NINGÚN componente conocido
  | "campo_invalido_o_faltante"; // las props que sí pertenecen a este componente están incompletas o mal tipadas

export interface DiscardedComponent {
  component?: string;
  id?: string;
  reason: string;
  kind: DiscardReason;
  /** Solo si kind === "mezcla": de qué otro(s) componente(s) viene la prop mezclada. */
  mixedFrom?: string[];
  candidate: unknown;
}

export interface ValidateComponentsResult {
  valid: AnyComponent[];
  discarded: DiscardedComponent[];
}

interface ZodIssueLike {
  code: string;
  path: (string | number)[];
  message: string;
  keys?: string[];
}

function formatIssues(issues: ZodIssueLike[]): string {
  return issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");
}

type ValidateFailure = { ok: false; reason: string; kind: DiscardReason; mixedFrom?: string[] };

export function validateComponent(candidate: unknown): { ok: true; component: AnyComponent } | ValidateFailure {
  if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
    return { ok: false, reason: "el candidato no es un objeto", kind: "malformado" };
  }

  const { component, id, ...props } = candidate as Record<string, unknown>;

  if (typeof component !== "string") {
    return { ok: false, reason: "falta o es inválido el campo 'component'", kind: "malformado" };
  }

  const schema = schemaByName.get(component);
  if (!schema) {
    return {
      ok: false,
      reason: `componente desconocido "${component}" (no está en el manifest del catálogo)`,
      kind: "componente_desconocido",
    };
  }

  const result = schema.safeParse(props);
  if (!result.success) {
    const issues = result.error.issues as ZodIssueLike[];
    const unrecognizedIssue = issues.find((i) => i.code === "unrecognized_keys");
    const otherIssues = issues.filter((i) => i.code !== "unrecognized_keys");

    if (unrecognizedIssue?.keys?.length) {
      const mixedFrom = new Set<string>();
      for (const key of unrecognizedIssue.keys) {
        for (const otherComponent of componentsByProp.get(key) ?? []) {
          if (otherComponent !== component) mixedFrom.add(otherComponent);
        }
      }

      if (mixedFrom.size > 0) {
        return {
          ok: false,
          reason: formatIssues(issues),
          kind: "mezcla",
          mixedFrom: [...mixedFrom],
        };
      }
      return { ok: false, reason: formatIssues(issues), kind: "prop_no_reconocida" };
    }

    return { ok: false, reason: formatIssues(otherIssues), kind: "campo_invalido_o_faltante" };
  }

  if (id !== undefined && typeof id !== "string") {
    return { ok: false, reason: "el campo 'id' debe ser string si está presente", kind: "malformado" };
  }

  const validated: Record<string, unknown> = { component, ...(result.data as Record<string, unknown>) };
  if (typeof id === "string") {
    validated.id = id;
  }

  return { ok: true, component: validated as AnyComponent };
}

function extractComponentAndId(candidate: unknown): { component?: string; id?: string } {
  if (typeof candidate !== "object" || candidate === null) return {};
  const record = candidate as Record<string, unknown>;
  return {
    component: typeof record.component === "string" ? record.component : undefined,
    id: typeof record.id === "string" ? record.id : undefined,
  };
}

// El responseJsonSchema que ve Gemini ya no enumera las 15 formas de
// componente (ver responseSchema.ts) — este es el único gate real, así que
// nunca se descarta en silencio: cada rechazo se loguea con component/id/
// razón/kind, y se devuelve estructurado para que el caller (PASO 3/4) lo
// pueda exponer en la respuesta de /mcp/chat, al menos en dev.
export function validateComponents(candidates: unknown[]): ValidateComponentsResult {
  const valid: AnyComponent[] = [];
  const discarded: DiscardedComponent[] = [];

  for (const candidate of candidates) {
    const result = validateComponent(candidate);
    if (result.ok) {
      valid.push(result.component);
      continue;
    }

    const { component, id } = extractComponentAndId(candidate);
    discarded.push({ component, id, reason: result.reason, kind: result.kind, mixedFrom: result.mixedFrom, candidate });
    const mixedNote = result.mixedFrom?.length ? ` mixedFrom=${result.mixedFrom.join(",")}` : "";
    console.warn(`[a2ui/validate] descartado component=${component ?? "?"} id=${id ?? "?"} kind=${result.kind}${mixedNote} razon=${result.reason}`);
  }

  return { valid, discarded };
}
