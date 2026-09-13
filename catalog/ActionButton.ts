import { z } from "zod";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import type { ComponentApi } from "@a2ui/web_core/v0_9";

const schema = z
  .object({
    etiqueta: CommonSchemas.DynamicString,
    variante: z.enum(["primaria", "secundaria"]).optional(),
    action: CommonSchemas.Action,
  })
  .strict()
  .describe(
    "Botón de acción autocontenido: a diferencia del Button del catálogo " +
      "base (que necesita un componente Text hijo aparte para su etiqueta), " +
      'aquí "etiqueta" va directo como texto. Úsalo para una llamada a la ' +
      'acción simple de una sola línea (ej. "Simular con estos datos", "Ver ' +
      'otro escenario", "Confirmar aportación"). Si la acción corresponde a ' +
      "un flujo determinista ya conocido (ver catalog/actions.ts), usa ese " +
      "nombre de evento exacto; si es una acción nueva que requiere que el " +
      "modelo genere la siguiente pantalla, puedes usar un nombre de evento " +
      "descriptivo propio. No lo uses para formularios de varios campos ni " +
      "para desplegar contenido — es solo un botón con una etiqueta y una " +
      "acción."
  );

export const ActionButton = {
  name: "ActionButton",
  schema,
} satisfies ComponentApi;
