// Tipos que reflejan la forma de las respuestas del backend (ver
// backend/a2ui/validate.ts y backend/usecase/*.usecase.ts). No se importan
// directo desde backend/ — son paquetes npm separados sin dependencia
// cruzada entre sí (solo comparten @hackbanorte/catalog) — así que esta
// forma se mantiene sincronizada a mano. Si backend/a2ui/validate.ts cambia
// los nombres de DiscardReason o la forma de DiscardedComponent, hay que
// actualizar esto también.
export type DiscardReason = "malformado" | "componente_desconocido" | "mezcla" | "prop_no_reconocida" | "campo_invalido_o_faltante";

export interface DiscardedComponent {
  component?: string;
  id?: string;
  reason: string;
  kind: DiscardReason;
  /** Solo si kind === "mezcla": de qué otro(s) componente(s) viene la prop mezclada. */
  mixedFrom?: string[];
  candidate: unknown;
}

export interface ChatApiSuccess {
  success: true;
  message: {
    conversationId: string;
    mensaje?: string;
    a2uiMessages: unknown[];
    discarded?: DiscardedComponent[];
  };
}

export interface ActionApiSuccess {
  success: true;
  route: "deterministic" | "llm";
  conversationId: string;
  mensaje?: string;
  a2uiMessages: unknown[];
}

export interface ApiValidationError {
  errors: { field?: string | number; message: string }[];
}

export interface ApiAppError {
  success: false;
  error: string;
  message: string;
}
