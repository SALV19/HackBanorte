import { z } from "zod";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import type { ComponentApi } from "@a2ui/web_core/v0_9";

const schema = z
  .object({
    titulo: CommonSchemas.DynamicString,
    montoObjetivo: CommonSchemas.DynamicNumber,
    montoActual: CommonSchemas.DynamicNumber,
  })
  .strict()
  .describe(
    "Tarjeta de una sola meta de ahorro: título, el monto objetivo y el " +
      "monto actual/proyectado hacia esa meta. Úsala para destacar UNA meta " +
      'concreta (ej. "junta un colchón de emergencia" o "llega a $X de saldo ' +
      'proyectado"). NO la uses para comparar varias metas o escenarios uno ' +
      "junto a otro (usa ScenarioComparison), ni para desglosar gastos (usa " +
      "ExpenseBreakdown). montoObjetivo y montoActual deben venir de un " +
      "resultado real de la tool de simulación (simular_retiro_pension) o de " +
      "datos financieros ya conocidos del usuario — nunca inventes ni " +
      "redondees estas cifras a ojo."
  );

export const GoalCard = {
  name: "GoalCard",
  schema,
} satisfies ComponentApi;
