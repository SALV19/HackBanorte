import { z } from "zod";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import type { ComponentApi } from "@a2ui/web_core/v0_9";

const categoriaSchema = z
  .object({
    categoria: CommonSchemas.DynamicString,
    monto: CommonSchemas.DynamicNumber,
  })
  .strict();

const schema = z
  .object({
    categorias: z.array(categoriaSchema),
    total: CommonSchemas.DynamicNumber.optional(),
  })
  .strict()
  .describe(
    "Desglose de gastos mensuales del usuario por categoría, con un total " +
      "opcional. Úsalo cuando el usuario pregunte en qué se le va el dinero o " +
      "quieras justificar cuánto le queda disponible para aportar al retiro. " +
      "NO lo uses para mostrar proyecciones de retiro (usa ProjectionChart o " +
      "GoalCard) ni para comparar escenarios (usa ScenarioComparison). Cada " +
      "categoría y monto deben venir de las transacciones reales del usuario " +
      "ya agregadas por el backend — nunca inventes categorías o montos que " +
      "no estén en esos datos."
  );

export const ExpenseBreakdown = {
  name: "ExpenseBreakdown",
  schema,
} satisfies ComponentApi;
