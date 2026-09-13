import { z } from "zod";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import type { ComponentApi } from "@a2ui/web_core/v0_9";

const schema = z
  .object({
    montoActual: CommonSchemas.DynamicNumber,
    montoObjetivo: CommonSchemas.DynamicNumber,
  })
  .strict()
  .describe(
    "Balanza visual de equilibrio entre DOS MONTOS ACUMULADOS y " +
      "COMPARABLES: montoActual (cuánto hay ahorrado/proyectado hasta HOY — " +
      "un total, no un pago periódico) en el platillo izquierdo, y " +
      "montoObjetivo (la meta de ahorro total a alcanzar) en el derecho. Es " +
      "la MISMA pareja de datos que GoalCard (montoActual/montoObjetivo), " +
      "pero como metáfora de balanza en vez de barra de progreso — úsala " +
      "cuando quieras enfatizar 'qué tan en equilibrio está' en vez de un " +
      "porcentaje. La balanza queda exactamente horizontal cuando " +
      "montoActual === montoObjetivo (la meta está alcanzada) y se inclina " +
      "hacia el lado más grande mientras más lejos estén uno del otro. " +
      "NUNCA pongas una aportación mensual (un FLUJO periódico, no un " +
      "total acumulado) en ninguno de los dos platillos: comparada contra " +
      "un monto acumulado, la balanza siempre queda al tope y no comunica " +
      "nada — para la aportación mensual usa ContributionSlider o " +
      "MonthlyIncomeCard en su lugar. Si no tienes una meta de ahorro " +
      "concreta que comparar, no uses este componente (usa MonthlyIncomeCard " +
      "o ProjectionChart). Ambos montos deben venir de datos financieros " +
      "reales del usuario o de un resultado de la tool de simulación — " +
      "nunca inventados ni recalculados a mano."
  );

export const ContributionBalance = {
  name: "ContributionBalance",
  schema,
} satisfies ComponentApi;
