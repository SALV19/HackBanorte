// Rutas del data model del surface A2UI. Las usa backend/a2ui/action.registry.ts
// para construir updateDataModel de forma determinista, y el prompt (PASO 5)
// para instruir al modelo dónde escribir/leer bindings {path:...}.
export const DATA_PATHS = {
  simulacion: {
    ahorroActual: "/simulacion/ahorro_actual",
    aportacionMensual: "/simulacion/aportacion_mensual",
    tasaAnual: "/simulacion/tasa_anual",
    aniosRestantes: "/simulacion/anios_restantes",
    saldoProyectado: "/simulacion/saldo_proyectado",
  },
} as const;

// El valor en vivo de un ContributionSlider concreto no tiene una ruta fija
// (cada instancia tiene su propio id, elegido por el modelo al crearlo) —
// sigue esta convención para que su propio action.event.context pueda
// referenciarlo con {path: sliderValuePath(id)}.
export function sliderValuePath(componentId: string): string {
  return `/sliders/${componentId}/value`;
}
