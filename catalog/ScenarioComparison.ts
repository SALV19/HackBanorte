import { z } from "zod";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import type { ComponentApi } from "@a2ui/web_core/v0_9";

const escenarioSchema = z
  .object({
    etiqueta: CommonSchemas.DynamicString,
    saldoProyectado: CommonSchemas.DynamicNumber,
    aportacionMensual: CommonSchemas.DynamicNumber,
    aniosRestantes: CommonSchemas.DynamicNumber,
    action: CommonSchemas.Action.optional(),
  })
  .strict();

const schema = z
  .object({
    escenarios: z.array(escenarioSchema),
  })
  .strict()
  .describe(
    "Comparación de 2 o más escenarios de retiro como TARJETAS planas, cada " +
      "una con las mismas métricas (saldo proyectado, aportación mensual, " +
      "años restantes). Es una lista de tarjetas lado a lado, NUNCA una " +
      "gráfica de radar ni nada con ejes o escalas — no le des ejes, mínimos, " +
      "máximos ni ángulos, solo números planos por escenario. Úsala cuando el " +
      'usuario pida comparar opciones (ej. "¿qué pasa si aporto $500 vs ' +
      '$1000?"). NO la uses para mostrar un solo escenario (usa GoalCard o ' +
      "ContributionBalance) ni para una tendencia en el tiempo de un solo " +
      "escenario (usa ProjectionChart). Cada escenario debe venir de una " +
      "llamada distinta y real a la tool simular_retiro_pension con " +
      "parámetros distintos — nunca inventes ni interpoles un escenario que " +
      "no calculó la tool. El action opcional de cada escenario, si se usa, " +
      "debe llamarse ACTIONS.SELECT_SCENARIO (ver catalog/actions.ts) y su " +
      'context debe tener EXACTAMENTE la forma { "aportacionMensual": <el ' +
      "mismo número literal que pusiste en la prop aportacionMensual de esa " +
      'tarjeta> } — la clave se llama "aportacionMensual" siempre, sin ' +
      "variaciones, porque el backend la lee por ese nombre exacto."
  );

export const ScenarioComparison = {
  name: "ScenarioComparison",
  schema,
} satisfies ComponentApi;
