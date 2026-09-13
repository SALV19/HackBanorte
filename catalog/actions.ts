// Nombres de acción fijos que backend/a2ui/action.registry.ts (PASO 4) sabe
// resolver de forma determinista, sin pasar por el LLM. Cualquier otro
// nombre de evento cae al flujo completo de Gemini + MCP.
export const ACTIONS = {
  CONTRIBUTION_CHANGED: "contribution_changed",
  SELECT_SCENARIO: "select_scenario",
} as const;
