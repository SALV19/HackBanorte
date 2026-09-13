import { FunctionDeclaration, Type } from "@google/genai";
import {
  getMonthlyExpenseReport,
  getMonthlySeries,
} from "../usecase/getExpensesReport.usecase";
import { forecastSeries } from "../usecase/forecast.usecase";

// Contexto pasado a la ejecución de la herramienta
export interface ToolContext {
  userId: string;
}

// Interfaces de entrada para cada Tool
export interface GetExpenseReportInput {
  year: number;
  month: number;
}

export interface GetSeriesInput {
  months: number;
}

export interface ForecastInput {
  historyMonths: number;
  monthsAhead: number;
}

// Definición de las herramientas con el esquema compatible con Gemini SDK
export const toolDefinitions: FunctionDeclaration[] = [
  {
    name: "get_expense_report",
    description:
      "Obtiene el reporte de gastos de un mes específico, agrupado por categoría, con el total general. Úsala cuando el usuario pida un 'reporte mensual de gastos' o algo similar.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        year: { type: Type.INTEGER, description: "Año, ej. 2026" },
        month: { type: Type.INTEGER, description: "Mes de 1 a 12" },
      },
      required: ["year", "month"],
    },
  },
  {
    name: "get_income_series",
    description:
      "Obtiene la serie mensual de ingresos de los últimos N meses. Úsala cuando el usuario pida ver ingresos a lo largo del tiempo.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        months: {
          type: Type.INTEGER,
          description: "Cantidad de meses hacia atrás, ej. 12",
        },
      },
      required: ["months"],
    },
  },
  {
    name: "get_expense_series",
    description:
      "Obtiene la serie mensual de gastos de los últimos N meses (total por mes, sin desglose por categoría).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        months: { type: Type.INTEGER },
      },
      required: ["months"],
    },
  },
  {
    name: "forecast_income",
    description:
      "Genera una predicción de ingresos para los próximos meses, basada en el histórico real del usuario. Úsala cuando el usuario pida una predicción o proyección de ingresos.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        historyMonths: {
          type: Type.INTEGER,
          description: "Meses de histórico a usar como base, ej. 12",
        },
        monthsAhead: {
          type: Type.INTEGER,
          description: "Cuántos meses hacia adelante predecir, ej. 3",
        },
      },
      required: ["historyMonths", "monthsAhead"],
    },
  },
  {
    name: "forecast_expenses",
    description:
      "Genera una predicción de gastos para los próximos meses, basada en el histórico real del usuario.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        historyMonths: { type: Type.INTEGER },
        monthsAhead: { type: Type.INTEGER },
      },
      required: ["historyMonths", "monthsAhead"],
    },
  },
];

/**
 * Ejecuta la tool solicitada por el modelo contra los datos reales.
 */
export async function executeTool(
  name: string,
  input: Record<string, any>,
  context: ToolContext,
) {
  const { userId } = context;

  switch (name) {
    case "get_expense_report": {
      const typedInput = input as GetExpenseReportInput;
      const data = await getMonthlyExpenseReport(userId, typedInput);
      return { chartHint: "bar_by_category", data };
    }

    case "get_income_series": {
      const typedInput = input as GetSeriesInput;
      const data = await getMonthlySeries(userId, "incomes", typedInput.months);
      return { chartHint: "line_timeseries", data };
    }

    case "get_expense_series": {
      const typedInput = input as GetSeriesInput;
      const data = await getMonthlySeries(
        userId,
        "expenses",
        typedInput.months,
      );
      return { chartHint: "line_timeseries", data };
    }

    case "forecast_income": {
      const typedInput = input as ForecastInput;
      const history = await getMonthlySeries(
        userId,
        "incomes",
        typedInput.historyMonths,
      );
      const data = forecastSeries(history, typedInput.monthsAhead);
      return { chartHint: "line_forecast", data };
    }

    case "forecast_expenses": {
      const typedInput = input as ForecastInput;
      const history = await getMonthlySeries(
        userId,
        "expenses",
        typedInput.historyMonths,
      );
      const data = forecastSeries(history, typedInput.monthsAhead);
      return { chartHint: "line_forecast", data };
    }

    default:
      throw new Error(`Tool desconocida: ${name}`);
  }
}
