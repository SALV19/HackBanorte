// El campo `id` se saca de lo que Gemini tiene que producir. Hallazgo real
// (ver plan, PASO 5): con `id` como string abierto sin restricción real,
// 4 de 4 casos de prueba en el modelo de producción degeneraron en basura o
// loops de repetición dentro de ese campo específico — no en `titulo`,
// `etiqueta` ni `mensaje`, que tienen contenido semántico real guiando la
// generación. `id` es puro bookkeeping sin señal de qué escribir, y ahí es
// donde el modelo se pierde.
//
// Los 8 componentes de dominio listados abajo son "singleton" por diseño —
// cada una de sus descriptions en catalog/ dice explícitamente "úsalo para
// UNA/UN X" — así que como mucho aparece una instancia por pantalla. Eso
// permite usar el nombre del tipo como id: fijo, predecible, y nunca lo
// tiene que inventar el modelo. Como bono, el path de binding de
// ContributionSlider (el único con {path:...}) se vuelve un literal fijo en
// vez de algo que Gemini tenga que inventar y recordar usar en dos campos
// distintos de la misma respuesta — ver services/prompt.service.ts.
//
// Todo lo demás (ActionButton, que sí puede repetirse en pantalla, y
// cualquier componente reusado de basicCatalog si algún día se expone a
// Gemini) recibe un id indexado por tipo + posición de aparición.
//
// SIEMPRE sobrescribe cualquier `id` que el candidato ya traiga — no solo
// rellena si falta — para cerrar el hueco por completo aunque Gemini ignore
// la instrucción de no escribirlo.
const ID_SINGLETON: ReadonlySet<string> = new Set([
  "RetirementTimeline",
  "GoalCard",
  "ProjectionChart",
  "ContributionSlider",
  "ContributionBalance",
  "ScenarioComparison",
  "MonthlyIncomeCard",
  "ExpenseBreakdown",
]);

export function assignDeterministicIds(candidates: unknown[]): unknown[] {
  const countByType = new Map<string, number>();

  return candidates.map((candidate) => {
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
      // No es un objeto — se deja tal cual, validate.ts lo va a rechazar.
      return candidate;
    }

    const record = candidate as Record<string, unknown>;
    const component = typeof record.component === "string" ? record.component : undefined;
    if (!component) {
      return candidate;
    }

    if (ID_SINGLETON.has(component)) {
      return { ...record, id: component };
    }

    const next = (countByType.get(component) ?? 0) + 1;
    countByType.set(component, next);
    return { ...record, id: `${component}_${next}` };
  });
}
