import { z } from "zod";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import type { ComponentApi } from "@a2ui/web_core/v0_9";

const schema = z
  .object({
    etiqueta: CommonSchemas.DynamicString,
    monto: CommonSchemas.DynamicNumber,
    subtitulo: CommonSchemas.DynamicString.optional(),
  })
  .strict()
  .describe(
    "Tarjeta de solo lectura para UN solo monto mensual (ingreso actual, " +
      "pensión mensual estimada, etc.), con una etiqueta y un subtítulo " +
      "opcional de contexto. Úsala para mostrar una sola cifra mensual de " +
      "forma destacada. NO la uses para desglosar varias categorías de gasto " +
      "(usa ExpenseBreakdown), para una meta de ahorro (usa GoalCard), ni " +
      'para comparar escenarios (usa ScenarioComparison). "monto" debe venir ' +
      "de los datos financieros reales del usuario (ingreso ya calculado por " +
      "el backend) o de un resultado de tool — nunca de una estimación " +
      "inventada por ti."
  );

export const MonthlyIncomeCard = {
  name: "MonthlyIncomeCard",
  schema,
} satisfies ComponentApi;
