# Estado de A2UI (v0.9) — handoff para el equipo

Este documento resume qué se implementó, por qué se tomaron ciertas
decisiones no obvias, y qué falta. Está escrito para alguien que no vivió
la implementación — si algo no tiene sentido sin más contexto, pregúntenle
a quien lo escribió antes de "corregirlo".

El plan completo con el detalle paso a paso (incluyendo cada prueba y cada
número exacto) vive en el historial de la sesión que lo construyó; esto es
el resumen ejecutivo.

## Qué quedó implementado

El backend reemplazó por completo el formato propio en español
(`tipo`/objetos anidados) por A2UI v0.9 real:

- **`catalog/`** (paquete `@hackbanorte/catalog`, workspace compartido): 9
  componentes de dominio (retiro/pensión) en Zod, más `paths.ts`,
  `actions.ts`, y `index.ts` con el `manifest`.
- **`backend/a2ui/`**: emisión de los 4 mensajes A2UI reales, validación
  contra el catálogo, asignación determinista de ids, y el registro de
  acciones deterministas.
- **`services/llm.ts`**: Fase A (tools MCP) + Fase B (Gemini estructurado)
  reescrito para producir mensajes A2UI reales en vez del formato viejo.
- **`services/prompt.service.ts`**: system prompt generado desde el
  catálogo, con 5 ejemplos completos de secuencias de mensajes.
- **`POST /a2ui/action`** (nuevo): ruta corta determinista para acciones
  conocidas (mover el slider, elegir un escenario) que no pasa por Gemini.
- **`POST /mcp/chat`**: mismo flujo de negocio, salida ahora son mensajes
  A2UI reales.
- **Smoke test visual** en `frontend/src/App.tsx` (descartable, ver más
  abajo) que prueba el pipeline completo contra un navegador real.

Todo esto está probado — con Zod sintético donde no hacía falta gastar
cuota de Gemini, y con la API real (y con Playwright contra un navegador
real para la parte visual) donde sí hacía falta.

## La frontera: `catalog/` vs `backend/a2ui/`

Esta línea se cruzó varias veces durante la implementación y vale la pena
que quede clara:

- **`catalog/` es dueño de todo lo que es protocolo A2UI o dominio.** Los 9
  schemas Zod (con `CommonSchemas.DynamicString`/`DynamicNumber`/`Action`
  REALES, sin simplificar), sus `description` (redactadas como instrucción
  para el modelo, no como documentación para humanos), `paths.ts`,
  `actions.ts`. No sabe nada de Gemini ni de cómo se genera un prompt.
- **`backend/a2ui/` es dueño de todo lo específico de Gemini/generación.**
  Construir el `responseJsonSchema` (incluida la versión "solo literal" que
  ve Gemini, ver más abajo), armar el system prompt, asignar ids, validar
  la salida real contra el schema de `catalog/`.

Consecuencia práctica: si algo es sobre "qué puede mostrar la UI", va en
`catalog/`. Si algo es sobre "cómo convencer a Gemini de generarlo bien", va
en `backend/a2ui/`.

## El techo de uniones de Gemini (para que nadie lo vuelva a descubrir)

Esto costó una sesión entera de pruebas en vivo descubrir. Resumen para no
repetirlo:

**Gemini rechaza con `400 INVALID_ARGUMENT` cualquier `responseJsonSchema`
que tenga demasiadas instancias de tipos "Dynamic" (uniones de 2-3 ramas:
literal | `{path}` | `{call}}`), sin importar cómo estén organizadas.**
Verificado en vivo, con números concretos:

- Un `anyOf` de las 15 formas de componente del catálogo (cada una con sus
  campos Dynamic reales): falla a partir de **6 ramas** (5-6KB), funciona
  con 4 (5.8KB). No es tamaño en bytes: una versión de 17KB con solo 15
  ramas falla igual que una de 61KB.
- Fusionar los 15 en un solo objeto plano (sin `anyOf`, todas las props como
  hermanos opcionales) **tampoco escapa el límite**: 3 componentes/11 props
  con tipos Dynamic reales pasa, 6 componentes/18 props Dynamic falla. Pero
  35 props **literales** (mismo conteo, sin ninguna unión Dynamic) sí pasan
  sin problema.

**Conclusión: el límite real es la cantidad TOTAL de instancias
`Dynamic*`/`Action` en el schema — no la cantidad de ramas `anyOf`, no la
cantidad de props sueltas.** No hay una cifra publicada por Google que
citar (su doc solo dice "very large or deeply nested schemas may be
rejected"); esto se determinó empíricamente.

**Fix implementado** — `backend/a2ui/literalize.ts`: deriva una versión
"solo literal" de cada schema de `catalog/` (colapsa `DynamicString`→
`string`, `DynamicNumber`→`number`, `Action`→`{event:{name,context}} |
{functionCall:{...}}` simplificado, recursivamente dentro de arrays de
objetos anidados) — **`catalog/` no cambia**, sigue teniendo los tipos
Dynamic reales; esto es puramente lo que Gemini VE en Fase B. La validación
real (`backend/a2ui/validate.ts`) siempre corre contra el schema REAL de
`catalog/`, nunca contra la versión literalizada.

Efecto secundario descubierto en el camino: con `component` restringido a
un `enum` (necesario, ver abajo) pero SIN declarar las props de cada
componente en el schema, Gemini dejaba de rellenarlas (`{"component":
"GoalCard"}` sin nada más) — el decoding restringido solo "sabe" de campos
declarados en `properties`, la prosa del prompt no alcanza. Por eso el
schema fusionado (con props literales) existe: es la única forma
encontrada de declarar TODAS las props sin volver a pisar el límite de
uniones.

**Riesgo conocido y medido, sin resolver:** con 35 props fusionadas como
hermanos planos (sin separación estructural por componente), Gemini a veces
mezcla props de un componente con las de otro (ej. un `ContributionSlider`
con `saldoProyectado` de `ContributionBalance` colado). `validate.ts`
detecta esto específicamente — el campo `kind: "mezcla"` en un descarte, con
`mixedFrom` diciendo de qué componente(s) vino la prop — y descarta el nodo
completo (nunca llega algo mal formado al cliente), pero es una tasa de
descarte real medida: **~10% de los casos de prueba** mostraron mezcla
genuina. No tiene arreglo estructural todavía — las opciones que se
consideraron y se descartaron: (a) un catálogo más chico por turno
(requiere clasificar la intención antes de llamar al modelo — una fase
extra, se decidió que no vale la pena todavía), (b) reforzar el prompt
(ayuda algo pero no elimina el problema, ya está probado con un ejemplo
extra de `ActionButton` que sí resolvió su omisión de campo, pero no toca
la mezcla). Si esto se vuelve un problema real en la demo, revisar
`backend/a2ui/validate.ts` (`kind: "mezcla"`) y `npm run measure-discard-rate
-w backend` para tener datos frescos antes de decidir un arreglo.

## Por qué existe `withRootWrapper` (services/llm.ts)

`A2uiSurface` (el componente de `@a2ui/react/v0_9` que renderiza un
surface) espera SIEMPRE un componente con id **exactamente** `"root"` como
punto de entrada del árbol. Sin uno, se queda mostrando `[Loading
root...]` para siempre — ni siquiera es un error, simplemente no pasa nada,
aunque el backend esté mandando componentes perfectamente válidos.

Esto se encontró en la prueba visual de PASO 6 (backend/a2ui/assignIds.ts
asigna ids por nombre de tipo — `"GoalCard"`, `"RetirementTimeline"` — para
que el diffing incremental sea estable entre turnos, y nunca asigna
`"root"`). Ninguna prueba a nivel backend lo hubiera detectado, porque el
JSON que se mandaba era 100% válido — el problema es puramente de
convención del lado del cliente.

`withRootWrapper()` envuelve TODOS los componentes validados de un turno en
un `Column` sintético con `id: "root"` cuyos `children` son esos
componentes, **siempre** (incluso con un solo componente). La razón de
envolver siempre, no solo cuando hay 2+: si el único componente de un turno
se llamara `"root"` directamente y luego apareciera un segundo componente
en un turno futuro, su id tendría que cambiar de `"root"` a su nombre real
— rompiendo el diffing de ESE componente específico entre esos dos turnos.

## `surfaceId == conversationId` (decisión de alcance, no del plan original)

El diseño asume **1 conversación = 1 surface**, fijo: `surfaceId` se asigna
igual al `_id` de Mongo de la conversación (ver `services/llm.ts` y
`usecase/handleA2uiAction.usecase.ts`). Por eso `POST /a2ui/action` no
necesita un campo `conversationId` separado — `action.surfaceId` ya lo es.

Si en algún momento se necesita más de un surface por conversación (ej. dos
pantallas A2UI independientes en la misma sesión de chat), esto es lo
primero que hay que romper: `model/Conversacion.ts`'s `a2uiSurface` tendría
que dejar de ser un subdocumento único, y habría que separar
`conversationId` de `surfaceId` en `handleA2uiAction.usecase.ts` y en
`services/llm.ts`.

## Cómo probar

- `npx tsc --noEmit` en `backend/` — type-check completo.
- `npm run measure-discard-rate -w backend` — corre 6 mensajes de prueba
  contra la API real y reporta tasa de descarte desglosada por `kind`
  (`mezcla`, `campo_invalido_o_faltante`, etc.). Acepta
  `CASES_FILTER=label1,label2` para correr solo un subconjunto (ver
  `backend/scripts/measureDiscardRate.ts`).
- El smoke test visual de `frontend/src/App.tsx` (con `npm run dev:back` +
  `npm run dev:front` desde la raíz) — **es descartable, se borra cuando
  se construya el frontend real** con sus propios componentes diseñados.
  Usa `basicCatalog` de `@a2ui/react/v0_9` más un `GenericFallback` feo
  (dump de JSON crudo) para los 9 componentes de dominio, porque el
  backend siempre genera desde el catálogo real sin importar qué sepa
  renderizar el cliente de prueba.

## Qué queda pendiente

- **El frontend real.** Los componentes de dominio (`GoalCard`,
  `ContributionSlider`, etc.) no tienen renderers de React diseñados
  todavía — solo el `GenericFallback` del smoke test. `frontend/src/App.tsx`
  hay que borrarlo/reemplazarlo cuando esto exista.
- **El riesgo de "mezcla" de props** (ver arriba) — medido, no resuelto.
  Vale la pena correr `measure-discard-rate` de nuevo con más variedad de
  mensajes antes de la demo para confirmar que el ~10% se mantiene estable
  y no crece.
- **`SELECT_SCENARIO`** en `backend/a2ui/action.registry.ts` está
  implementado y probado contra la tool MCP real, pero no se probó
  end-to-end con un `ScenarioComparison` real renderizado y clickeado (el
  smoke test solo ejercitó `CONTRIBUTION_CHANGED`, sintéticamente).
- **La ruta de fallback a LLM de `/a2ui/action`** (cuando `action.name` no
  está en el registro) está implementada pero no se probó end-to-end contra
  Gemini real — la lógica de construcción del mensaje sintético sí se
  revisó a mano.
- **Cuota de Gemini**: el proyecto usa el tier gratuito
  (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, 20 solicitudes/día
  por modelo). Se agotó varias veces durante esta implementación. Si la
  demo depende de `gemini-3.6-flash` específicamente, vale la pena
  confirmar el plan de cuota antes del día del evento.
