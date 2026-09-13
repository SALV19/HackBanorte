/**
 * forecast.js
 * -----------
 * Predicción simple sobre series mensuales. No depende del LLM: es
 * matemática determinista, así los números no se los "inventa" el modelo.
 *
 * Usa regresión lineal simple sobre el índice de mes -> monto. Para series
 * cortas o muy ruidosas, esto es razonable como primer approach; si más
 * adelante quieres algo más fino (estacionalidad, Holt-Winters, etc.) se
 * puede sustituir esta función sin tocar el resto del agente.
 */

import {
  linearRegression,
  linearRegressionLine,
  rSquared,
} from "simple-statistics";

/**
 * @param {{year:number, month:number, total:number}[]} series - histórico ordenado cronológicamente
 * @param {number} monthsAhead
 */
export function forecastSeries(series, monthsAhead = 3) {
  const points = series.map((s, i) => [i, s.total]);
  const regression = linearRegression(points);
  const predict = linearRegressionLine(regression);
  const r2 = rSquared(points, predict);

  const lastPoint = series[series.length - 1];
  const forecast = [];
  for (let i = 1; i <= monthsAhead; i++) {
    const idx = series.length - 1 + i;
    const d = new Date(Date.UTC(lastPoint.year, lastPoint.month - 1 + i, 1));
    forecast.push({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      total: Math.max(0, Math.round(predict(idx))),
    });
  }

  return {
    historical: series,
    forecast,
    method: "regresión lineal sobre serie mensual",
    // r2 cercano a 1 = tendencia lineal clara; cercano a 0 = datos muy irregulares
    fitQuality: Number(r2.toFixed(2)),
  };
}
