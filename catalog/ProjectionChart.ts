import { z } from "zod";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import type { ComponentApi } from "@a2ui/web_core/v0_9";

const puntoSchema = z
  .object({
    etiqueta: CommonSchemas.DynamicString,
    saldo: CommonSchemas.DynamicNumber,
  })
  .strict();

const schema = z
  .object({
    titulo: CommonSchemas.DynamicString.optional(),
    puntos: z.array(puntoSchema),
  })
  .strict()
  .describe(
    "Gráfica de proyección del saldo de retiro a lo largo del tiempo: una " +
      "lista de puntos (etiqueta, saldo) que se dibuja como serie temporal. " +
      "Úsala cuando tengas varios puntos en el tiempo (ej. saldo proyectado " +
      "cada cierto número de años) que muestren una tendencia o crecimiento. " +
      "NO la uses para un solo valor puntual (usa GoalCard o " +
      "MonthlyIncomeCard), ni para comparar 2 o 3 escenarios completos lado a " +
      "lado (usa ScenarioComparison, que va en tarjetas, no en ejes). Cada " +
      '"saldo" debe salir de una corrida real de la tool de simulación con un ' +
      "parámetro de años distinto por punto — nunca interpoles ni inventes un " +
      "punto intermedio que no calculó la tool."
  );

export const ProjectionChart = {
  name: "ProjectionChart",
  schema,
} satisfies ComponentApi;
