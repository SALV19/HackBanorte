import { z } from "zod";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import type { ComponentApi } from "@a2ui/web_core/v0_9";

const schema = z
  .object({
    edadActual: CommonSchemas.DynamicNumber,
    edadRetiro: CommonSchemas.DynamicNumber,
    aniosRestantes: CommonSchemas.DynamicNumber,
  })
  .strict()
  .describe(
    "Línea de tiempo de retiro: muestra la edad actual del usuario, la edad " +
      "objetivo de retiro y los años que faltan entre ambas. Úsalo para dar " +
      'contexto de "dónde está" el usuario en su camino al retiro, típicamente ' +
      "al inicio de una respuesta o antes de mostrar montos. NO lo uses para " +
      "mostrar dinero, saldos ni proyecciones (usa ProjectionChart o GoalCard " +
      "para eso), ni para comparar varios escenarios (usa ScenarioComparison). " +
      "edadActual y edadRetiro vienen del perfil del usuario ya conocido por " +
      "el backend; aniosRestantes debe ser exactamente edadRetiro - " +
      "edadActual, o el mismo valor que ya se usó como anios_restantes en una " +
      "simulación de la tool de retiro — no inventes una cifra distinta."
  );

export const RetirementTimeline = {
  name: "RetirementTimeline",
  schema,
} satisfies ComponentApi;
