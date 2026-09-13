// Deriva una versión "solo literal" de un schema de catalog/ — colapsa
// CommonSchemas.DynamicString/DynamicNumber a su rama literal (string/number)
// y CommonSchemas.Action a una forma simplificada {name, context}, incluso
// dentro de arrays de objetos anidados (ej. ProjectionChart.puntos,
// ScenarioComparison.escenarios, ExpenseBreakdown.categorias).
//
// Por qué existe (ver hallazgo en el plan, PASO 5): un schema fusionado de
// los 15 componentes con sus tipos REALES (Dynamic*/Action, cada uno una
// unión de 2-3 ramas) sigue rechazado por Gemini con 400 más allá de un
// puñado de componentes — no es cuestión de anyOf (eso ya se sabía, PASO 2)
// ni de cantidad de props sueltas (11 props literales pasan, 18 con
// Dynamic* no) — es la cantidad TOTAL de instancias Dynamic*/Action en el
// schema, sin importar cómo estén organizadas. Quitando esas uniones (y
// dejando solo la rama literal) el mismo conteo de props sí pasa.
//
// catalog/ NO cambia: sigue siendo la fuente de verdad real, con
// Dynamic*/Action intactos, y es contra ESE schema que valida
// backend/a2ui/validate.ts. Esto es puramente lo que Gemini VE en Fase B.
//
// LIMITACIÓN CONOCIDA: la detección de abajo es por igualdad de referencia
// (`inner === CommonSchemas.DynamicString`), así que solo cacha los 9
// componentes de dominio (que importan CommonSchemas directo de
// catalog/*.ts). Los 6 básicos reusados (Text/Button/Column/Row/Card/
// Slider, de @a2ui/web_core/v0_9/basic_catalog) construyen su propio
// equivalente de DynamicString/Number internamente — misma forma, pero otra
// instancia de objeto — así que sus campos (text/label/value/children/
// checks) NO se literalizan y quedan con sus uniones reales. Verificado que
// esto no rompe nada hoy (buildResponseJsonSchema pasó 3/3 pruebas en vivo
// con esto presente) porque son pocas instancias sueltas, pero si el
// catálogo alguna vez depende más de los básicos, esto podría volver a
// acercarse al límite de complejidad — ver Hallazgo 4 en responseSchema.ts.
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import { z } from "@hackbanorte/catalog";

function unwrapOptional(schema: any): any {
  if (schema?._def?.typeName === "ZodOptional") {
    return unwrapOptional(schema._def.innerType);
  }
  return schema;
}

function literalizeField(fieldSchema: any): any {
  const inner = unwrapOptional(fieldSchema);

  if (inner === CommonSchemas.DynamicString) return z.string();
  if (inner === CommonSchemas.DynamicNumber) return z.number();
  if (inner === CommonSchemas.Action) {
    // El schema REAL es {event:{name,context}} | {functionCall:{...}} — ver
    // catalog/*.ts y CommonSchemas.Action. Un bug real pasó por aquí: una
    // primera versión colapsaba a {name,context} PLANO (sin el envoltorio
    // "event"), y Gemini, obligado por el schema, producía exactamente eso
    // — validate.ts lo rechazaba siempre porque el schema real exige
    // "event". "event"/"functionCall" quedan como hermanos opcionales (no
    // un anyOf) para no reintroducir el problema de uniones del Hallazgo 4.
    return z.object({
      event: z
        .object({
          name: z.string(),
          context: z.record(z.string(), z.any()).optional(),
        })
        .optional(),
      functionCall: z
        .object({
          call: z.string(),
          args: z.record(z.string(), z.any()),
        })
        .optional(),
    });
  }

  if (inner?._def?.typeName === "ZodArray") {
    const elementType = inner._def.type;
    if (elementType?._def?.typeName === "ZodObject") {
      return z.array(literalizeObjectShape(elementType));
    }
    return inner;
  }

  return inner;
}

function literalizeObjectShape(zodObject: any): any {
  const shape = zodObject.shape as Record<string, any>;
  const result: Record<string, any> = {};
  for (const [key, fieldSchema] of Object.entries(shape)) {
    result[key] = literalizeField(fieldSchema).optional();
  }
  return z.object(result);
}

export function literalizeComponentSchema(schema: any): any {
  return literalizeObjectShape(schema);
}
