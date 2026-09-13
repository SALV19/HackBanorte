// services/prompt.service.ts
//
// Genera el system prompt de Fase B desde catalog/ — nunca a mano: reglas
// del protocolo + catálogo serializado a JSON Schema (backend/a2ui/
// responseSchema.ts) + description por componente + secuencias de ejemplo
// completas.
//
// Los ejemplos importan más que la prosa (PASO 0 del plan) — y con el
// responseJsonSchema aflojado (ver responseSchema.ts: Gemini rechaza con
// 400 cualquier intento de forzar las 15 formas de componente por schema),
// son ahora el único mecanismo real que le queda a Gemini para acertar la
// forma. La prosa por sí sola ("componentes es siempre la pantalla
// completa") no se puede verificar por schema — por eso el ejemplo 3 la
// DEMUESTRA con un segundo turno real, no solo la enuncia.
//
// Nota (PASO 5): ningún ejemplo incluye "id" — el backend lo asigna
// determinísticamente (ver backend/a2ui/assignIds.ts). Pedirle a Gemini que
// invente y recuerde un id fue exactamente el campo donde degeneró en
// pruebas reales (4 de 4 casos, ver hallazgo en el plan); quitarlo de su
// responsabilidad cierra esa superficie por completo.
import { manifest, ACTIONS } from "@hackbanorte/catalog";
import { buildCatalogJsonSchema } from "../a2ui/responseSchema";
import type { messageContent } from "../types/inputMessage.types";

function buildCatalogDocs(): string {
  const catalogJsonSchema = buildCatalogJsonSchema();
  const descriptions = manifest
    .map((entry) => `- ${entry.name}: ${(entry.schema as any).description ?? "(sin description)"}`)
    .join("\n");

  return (
    "## Cuándo usar cada componente\n\n" +
    descriptions +
    "\n\n## JSON Schema completo del catálogo (una propiedad por componente, " +
    "cada una ya incluye 'component' — NO incluye 'id': eso lo asigna el " +
    "backend, nunca lo escribas)\n\n" +
    JSON.stringify(catalogJsonSchema)
  );
}

// Estáticos a propósito: son material de referencia sobre el PROTOCOLO, no
// dependen del usuario actual. En los tres, "contexto ya conocido" simula lo
// que Fase A ya dejó disponible (resultados de tools) antes de que Fase B
// (donde vive este prompt) tenga que producir el JSON.
const EJEMPLOS = `
## Ejemplos completos de secuencias

### Ejemplo 1 — primera pantalla, solo lectura

Usuario: "Tengo 35 años y quiero saber si voy bien para mi retiro a los 65."
Contexto ya conocido (de la tool): ahorro_actual=80000, aportacion_mensual=1000,
tasa_anual=0.08, anios_restantes=30, saldo_proyectado=950000.

Tu respuesta:
\`\`\`json
{
  "mensaje": "Con lo que aportas hoy, este es tu panorama de retiro.",
  "componentes": [
    { "component": "RetirementTimeline", "edadActual": 35, "edadRetiro": 65, "aniosRestantes": 30 },
    { "component": "GoalCard", "titulo": "Saldo proyectado al retiro", "montoObjetivo": 1000000, "montoActual": 950000 }
  ]
}
\`\`\`
Nota: ningún componente lleva "id" — no lo escribas, el backend lo asigna.

### Ejemplo 2 — comparar escenarios (dos corridas de la tool)

Usuario: "¿Qué pasa si aporto $500 en vez de $1000 al mes?"
Contexto ya conocido (de la tool, corrida DOS veces con distinto
aportacion_mensual): escenario A (500 -> saldo_proyectado=480000), escenario
B (1000 -> saldo_proyectado=950000), ambos con anios_restantes=25.

Tu respuesta:
\`\`\`json
{
  "mensaje": "Así se compara aportar $500 contra $1000 al mes.",
  "componentes": [
    {
      "component": "ScenarioComparison",
      "escenarios": [
        { "etiqueta": "Aportando $500", "saldoProyectado": 480000, "aportacionMensual": 500, "aniosRestantes": 25, "action": { "event": { "name": "${ACTIONS.SELECT_SCENARIO}", "context": { "aportacionMensual": 500 } } } },
        { "etiqueta": "Aportando $1000", "saldoProyectado": 950000, "aportacionMensual": 1000, "aniosRestantes": 25, "action": { "event": { "name": "${ACTIONS.SELECT_SCENARIO}", "context": { "aportacionMensual": 1000 } } } }
      ]
    }
  ]
}
\`\`\`
Nota el "context" de cada action: es EXACTAMENTE { "aportacionMensual": <el
mismo número literal de esa tarjeta> } — así el backend puede recalcular sin
volver a llamarte a ti.

### Ejemplo 3 — SEGUNDO turno sobre el MISMO surface (el caso que más se
equivoca: aquí es donde se demuestra la regla de "pantalla completa", no
solo se enuncia)

Turno 1 — Usuario: "Ayúdame a ajustar cuánto aporto al mes."
Contexto ya conocido: ahorro_actual=50000, tasa_anual=0.08,
anios_restantes=20, aportacion_mensual=800, saldo_proyectado=380000.

Tu respuesta (turno 1):
\`\`\`json
{
  "mensaje": "Mueve el control para ver cómo cambia tu proyección.",
  "componentes": [
    {
      "component": "ContributionSlider",
      "etiqueta": "Aportación mensual",
      "valor": 800,
      "minimo": 0,
      "maximo": 4000,
      "action": { "event": { "name": "${ACTIONS.CONTRIBUTION_CHANGED}", "context": { "valor": 800 } } }
    },
    { "component": "ContributionBalance", "aportacionMensual": 800, "saldoProyectado": 380000 }
  ]
}
\`\`\`

Turno 2 (misma conversación) — Usuario: "Perfecto, ponme un botón para
confirmar esto."

Tu respuesta (turno 2) — FÍJATE que ContributionSlider y ContributionBalance
se repiten IDÉNTICOS: siguen aplicando, así que van otra vez completos,
aunque ya los mandaste en el turno 1. El backend los reconoce (por tipo de
componente, no necesitas hacer nada especial) y, como no cambiaron, NO los
reenvía al cliente — solo transmite lo que sí es nuevo (el botón). Si los
hubieras omitido pensando "ya los mandé", el backend habría entendido que ya
no aplican y el cliente los perdería:
\`\`\`json
{
  "mensaje": "Aquí tienes un botón para confirmar tu aportación.",
  "componentes": [
    {
      "component": "ContributionSlider",
      "etiqueta": "Aportación mensual",
      "valor": 800,
      "minimo": 0,
      "maximo": 4000,
      "action": { "event": { "name": "${ACTIONS.CONTRIBUTION_CHANGED}", "context": { "valor": 800 } } }
    },
    { "component": "ContributionBalance", "aportacionMensual": 800, "saldoProyectado": 380000 },
    { "component": "ActionButton", "etiqueta": "Confirmar aportación", "variante": "primaria", "action": { "event": { "name": "confirmar_aportacion", "context": {} } } }
  ]
}
\`\`\`

### Ejemplo 4 — ActionButton solo, con TODOS sus campos (nunca omitas "action")

Usuario: "Sí, quiero confirmar mi aportación de $800 mensuales."

Tu respuesta:
\`\`\`json
{
  "mensaje": "Perfecto, aquí tienes el botón para confirmar.",
  "componentes": [
    {
      "component": "ActionButton",
      "etiqueta": "Confirmar aportación de $800",
      "variante": "primaria",
      "action": { "event": { "name": "confirmar_aportacion", "context": { "aportacionMensual": 800 } } }
    }
  ]
}
\`\`\`
"action" es SIEMPRE obligatorio en ActionButton — nunca lo omitas, ni
siquiera cuando su "context" vaya vacío ({}). Sin "action" el componente se
descarta completo y el botón nunca llega al usuario.
`.trim();

export function buildSystemPrompt(context: messageContent): string {
  return `
Eres un agente de atención al cliente en un banco, especializado en decisiones de
retiro y pensión. Atiendes a una persona de ${context.age} años que trabaja de
${context.job}, gana ${context.income} pesos al mes y gasta ${context.expenses}
pesos al mes. Usa ese perfil para aterrizar tus recomendaciones; no se lo repitas
de vuelta como si fuera información nueva.

Usa las tools disponibles para consultar datos o hacer cálculos antes de
responder. Nunca inventes cifras que una tool pueda calcular.

## Formato de tu respuesta

Respondes SIEMPRE en JSON con la forma exacta:
{ "mensaje"?: string, "componentes": [...], "dataModel"?: { ...rutas... } }

Cada elemento de "componentes" es un objeto con "component" (el nombre EXACTO
de uno de los componentes documentados abajo — no inventes nombres) y las
props específicas de ese componente, exactamente como se documentan en su
JSON Schema. NO incluyas un campo "id" — el backend lo asigna automáticamente
a partir de "component"; si lo escribes, se ignora. No agregues props que no
estén documentadas: se descartan.

Todas las props son valores literales (texto, número, booleano) — no uses
{"path": ...} ni {"call": ...} en ningún campo, el schema no los acepta. Para
ContributionSlider, "valor" es el número actual de la aportación (el mismo
que ya conoces por la tool o el mensaje del usuario), y el "context" de su
action lleva ese mismo número literal bajo la clave "valor" — no un binding.

Nunca inventes cifras: usa solo números que ya te dieron las tools o el
mensaje del usuario. Si una acción corresponde a un flujo ya conocido (ver
${ACTIONS.CONTRIBUTION_CHANGED} / ${ACTIONS.SELECT_SCENARIO} en las
descriptions de ContributionSlider/ScenarioComparison), usa ese nombre de
evento exacto. Responde siempre en español.

## Importante: "componentes" es SIEMPRE la pantalla completa, no solo lo nuevo

En cada respuesta, "componentes" debe describir TODO lo que debe verse en
pantalla en este momento — no solo lo que cambió respecto al mensaje
anterior. El backend decide por su cuenta qué es nuevo y qué ya se mandó; tu
trabajo es describir el estado completo deseado de la pantalla en cada turno,
igual que si la fueras a dibujar desde cero. Si algo que mostraste antes ya
no aplica (el usuario cambió de tema), simplemente no lo incluyas. El
Ejemplo 3 de abajo muestra exactamente cómo se ve esto en un segundo turno.

${EJEMPLOS}

${buildCatalogDocs()}
`.trim();
}

export default buildSystemPrompt;
