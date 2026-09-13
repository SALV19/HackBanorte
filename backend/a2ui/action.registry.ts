// Mapa de nombre de acción -> tool MCP + cómo construir el updateDataModel
// resultante. Si action.name está aquí, la ruta corta de POST /a2ui/action
// llama la tool directo (sin pasar por Gemini) y devuelve solo
// updateDataModel — nunca updateComponents, el árbol no cambia.
//
// Los nombres de las claves de `context` (ej. "valor", "aportacionMensual")
// están fijados en las descriptions de catalog/ContributionSlider.ts y
// catalog/ScenarioComparison.ts respectivamente — si esto cambia, hay que
// actualizar esas descriptions también.
import { getMcpClient } from "../services/mcpClient";
import { DATA_PATHS, ACTIONS } from "@hackbanorte/catalog";

export interface ActionHandlerInput {
  /** A2uiClientAction.context — ya resuelto por el cliente (sin {path}). */
  context: Record<string, unknown>;
  /** a2uiSurface.dataModel actual, para completar los args que la acción no trae. */
  dataModel: Record<string, unknown>;
}

/** path del data model -> nuevo valor, para armar los updateDataModel. */
export type ActionHandler = (input: ActionHandlerInput) => Promise<Record<string, unknown>>;

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

interface SimulacionResult {
  saldo_proyectado: number;
  anios_restantes: number;
  aportacion_mensual: number;
}

function parseToolResultText(result: unknown): SimulacionResult {
  const content = (result as { content?: Array<{ type: string; text?: string }> } | undefined)?.content;
  const textBlock = Array.isArray(content) ? content.find((c) => c.type === "text") : undefined;
  if (!textBlock?.text) {
    throw new Error("simular_retiro_pension no devolvió contenido de texto");
  }
  return JSON.parse(textBlock.text) as SimulacionResult;
}

async function recomputeSimulacion(aportacionMensual: number, dataModel: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ahorroActual = readNumber(dataModel[DATA_PATHS.simulacion.ahorroActual]) ?? 0;
  const tasaAnual = readNumber(dataModel[DATA_PATHS.simulacion.tasaAnual]) ?? 0.08;
  const aniosRestantes = readNumber(dataModel[DATA_PATHS.simulacion.aniosRestantes]) ?? 20;

  const result = await getMcpClient().callTool({
    name: "simular_retiro_pension",
    arguments: {
      ahorro_actual: ahorroActual,
      aportacion_mensual: aportacionMensual,
      tasa_anual: tasaAnual,
      anios_restantes: aniosRestantes,
    },
  });

  const parsed = parseToolResultText(result);

  return {
    [DATA_PATHS.simulacion.aportacionMensual]: aportacionMensual,
    [DATA_PATHS.simulacion.saldoProyectado]: parsed.saldo_proyectado,
  };
}

export const actionRegistry: Record<string, ActionHandler> = {
  [ACTIONS.CONTRIBUTION_CHANGED]: async ({ context, dataModel }) => {
    const aportacionMensual = readNumber(context.valor);
    if (aportacionMensual === undefined) {
      throw new Error(`${ACTIONS.CONTRIBUTION_CHANGED}: context.valor no es un número válido (recibido: ${JSON.stringify(context.valor)})`);
    }
    return recomputeSimulacion(aportacionMensual, dataModel);
  },

  [ACTIONS.SELECT_SCENARIO]: async ({ context, dataModel }) => {
    const aportacionMensual = readNumber(context.aportacionMensual);
    if (aportacionMensual === undefined) {
      throw new Error(`${ACTIONS.SELECT_SCENARIO}: context.aportacionMensual no es un número válido (recibido: ${JSON.stringify(context.aportacionMensual)})`);
    }
    return recomputeSimulacion(aportacionMensual, dataModel);
  },
};
