# Asistente financiero con reportes A2UI

El chat consulta movimientos y documentos del perfil seleccionado y construye
reportes con tarjetas, tablas, gráficas, fuentes y un simulador de retiro.

## Ejecutar

Conserva las credenciales de `backend/.env`; las variables disponibles están en
`backend/.env.example`. Desde la raíz del proyecto:

```powershell
npm.cmd run install:all
npm.cmd run dev
```

Abre <http://localhost:5173>. El frontend envía `POST /mcp/chat` a través del
proxy de Vite hacia el backend en el puerto 3000. `GET /mcp/profiles` carga los
perfiles desde MongoDB. Si cambias el puerto del backend, ajusta el proxy en
`frontend/vite.config.ts`.

Ejemplos de consultas:

- «Muéstrame mis gastos de agosto de 2026 en una tabla y una gráfica».
- «¿Y el mes anterior?» para continuar la conversación.
- «Genera un reporte de mis ingresos y gastos de los últimos seis meses».
- «Quiero planear mi retiro» para abrir el formulario de simulación.

## Recorrido de una consulta

1. Se valida el mensaje y se busca el perfil por `users.name`.
2. El modelo identifica intención, fechas, categoría, consulta semántica y
   secciones del reporte. Los seguimientos incluyen el historial del perfil.
3. MongoDB agrega los movimientos por usuario y periodo. Los importes positivos
   se consideran ingresos y los negativos gastos. Los totales incluyen todos los
   movimientos del filtro; la tabla muestra como máximo los 50 más recientes.
4. `$vectorSearch` envía texto al índice `document_embedding` de `documents`.
   Atlas genera el embedding automáticamente y filtra por `id_user` (ObjectId).
5. El modelo explica los resultados y selecciona secciones del catálogo. El
   backend vincula los valores de los componentes a los datos calculados.
6. React renderiza los mensajes A2UI y permite enviar seguimientos y formularios
   por la misma ruta. Las conversaciones están asociadas al perfil en
   `reportconversations`.

El periodo predeterminado abarca desde el inicio del mes de hace cinco meses
hasta hoy. Las fechas de consulta y agrupación usan UTC y se muestran en el
reporte. El balance es el flujo neto del periodo, no el saldo de una cuenta.
El simulador usa los parámetros explícitos del formulario, con aportaciones al
final de cada mes; no obtiene una tasa ni un saldo supuesto de un modelo.

## A2UI

Se utiliza el protocolo **A2UI v0.9** con el catálogo propio
`urn:hackbanorte:a2ui:report:v1`. La respuesta HTTP agrupa mensajes
`createSurface`, `updateDataModel` y `updateComponents` en `message.a2ui`.
El transporte es JSON por solicitud, sin streaming. Es un renderizador local
del catálogo del proyecto, no una implementación de todos los catálogos A2UI.

El contrato está en `shared/a2ui.d.ts`; el generador está en
`backend/views/report.builder.ts` y el renderizador en
`frontend/src/components/organisms/ReportRenderer.tsx`.

| Componente | Uso |
| --- | --- |
| Column / Text | Distribución y explicación |
| Metric | Importes calculados vinculados por JSON Pointer |
| Table | Movimientos y desglose por categoría |
| Chart | Barras o líneas con leyenda, selección de periodo y tabla accesible |
| Sources | Documentos recuperados, desplegables |
| ReportForm | Parámetros de simulación capturados por el usuario |
| Suggestions | Preguntas de seguimiento enviadas al chat |

El cliente ejecuta componentes predefinidos de React y reutiliza el botón del
proyecto; no ejecuta HTML, JavaScript ni consultas generadas por el modelo.

Referencia: [especificación oficial de A2UI v0.9](https://a2ui.org/specification/v0.9-a2ui/).

## Proveedores y estado sin servicio

`LLM_PROVIDER` puede ser `gemini` u `ollama`. Ambos usan salida JSON validada con
Zod. Las claves permanecen en el backend. Si el proveedor falla o agota su cuota,
se usan reglas básicas para las intenciones y periodos habituales y el reporte
muestra un aviso explícito. Ese modo no ofrece interpretación libre ni síntesis
documental del modelo; muestra los datos y documentos recuperados. Una falla de
Vector Search también se muestra y no se presenta como una búsqueda exitosa.

Los perfiles son de demostración: el selector no es un sistema de autenticación.
El usuario escogido restringe todas las consultas y el acceso a la conversación.

## Verificación

```powershell
npm.cmd test --prefix backend
npm.cmd run build --prefix frontend
npm.cmd run lint --prefix frontend
npm.cmd run test:e2e --prefix frontend
```

Las pruebas de navegador usan Microsoft Edge instalado y servicios simulados.
Para usar Chromium en otra plataforma, ajusta `channel` en
`frontend/playwright.config.ts` e instala el navegador de Playwright.

Con ambos servidores iniciados, esta prueba optativa consulta los servicios
reales, compara los totales contra Atlas y verifica las fuentes por usuario:

```powershell
cd backend
node --env-file=.env tests/live-chat.cjs
```

Puede consumir cuota del modelo y de Automated Embedding. Elimina únicamente
la conversación temporal creada por esa prueba.

Para servir el build de React desde Express:

```powershell
npm.cmd run build --prefix frontend
npm.cmd run build --prefix backend
npm.cmd start --prefix backend
```

Abre <http://localhost:3000>. La API y el frontend se sirven desde el mismo origen.
