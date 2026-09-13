import { z } from "zod";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import type { ComponentApi } from "@a2ui/web_core/v0_9";
import { sliderValuePath } from "./paths";

// Es un componente "singleton" (a lo mucho una instancia por pantalla, ver
// description abajo) — el backend le asigna siempre id="ContributionSlider"
// (ver backend/a2ui/assignIds.ts), así que esta ruta es un literal FIJO, no
// algo que el modelo tenga que inventar ni recordar usar en dos campos.
const RUTA_VALOR = sliderValuePath("ContributionSlider");

const schema = z
  .object({
    etiqueta: CommonSchemas.DynamicString,
    valor: CommonSchemas.DynamicNumber,
    minimo: CommonSchemas.DynamicNumber,
    maximo: CommonSchemas.DynamicNumber,
    paso: CommonSchemas.DynamicNumber.optional(),
    action: CommonSchemas.Action,
  })
  .strict()
  .describe(
    "Control deslizable para que el usuario ajuste su aportación mensual al " +
      'retiro. Úsalo cuando quieras que el usuario pueda experimentar "qué ' +
      'pasa si aporto más/menos" de forma interactiva, en vez de solo ' +
      "mostrarle un número fijo. NO lo uses de solo lectura — si no necesitas " +
      "que el usuario lo mueva, usa ContributionBalance o MonthlyIncomeCard. " +
      "minimo y maximo deben ser límites razonables derivados del ingreso o " +
      "la aportación actual del usuario, no números arbitrarios. La action " +
      "debe usar el nombre de evento fijo de ACTIONS.CONTRIBUTION_CHANGED " +
      "(ver catalog/actions.ts) para que el backend la pueda procesar sin " +
      "pasar por el modelo cada vez que se mueve el control. No pongas 'id' " +
      "(el backend lo asigna siempre como 'ContributionSlider', ya que como " +
      `mucho hay una instancia por pantalla). Tanto la prop "valor" como el ` +
      `"context" de la action deben usar EXACTAMENTE el mismo path fijo: ` +
      `"valor": {"path": "${RUTA_VALOR}"} y ` +
      `"action": {"event": {"name": "contribution_changed", "context": ` +
      `{"valor": {"path": "${RUTA_VALOR}"}}}} — es un literal, no lo ` +
      "inventes ni lo cambies."
  );

export const ContributionSlider = {
  name: "ContributionSlider",
  schema,
} satisfies ComponentApi;
