# Búsqueda de documentos con Automated Embedding

El flujo es `inputMessage.content → $vectorSearch → documentos → Gemini → A2UI`.
Atlas genera el vector de la consulta usando el modelo del campo `autoEmbed`.
No necesitas llamar a `embedTexto`, guardar el vector del mensaje ni enviar
`queryVector`. El vector no regresa al backend: regresan documentos y su score.

## Configuración

En `backend/.env`, conserva tus credenciales y agrega:

```dotenv
MONGO_DB_NAME=hackbanorte
DOCUMENTS_VECTOR_INDEX=document_embedding
DOCUMENTS_VECTOR_PATH=content
```

`DOCUMENTS_VECTOR_PATH` debe coincidir con el campo `path` de tipo `autoEmbed`
de tu índice. El valor predeterminado es `content`, según `documents.model.ts`.
`MONGO_URI` debe apuntar a tu clúster de Atlas. `MONGO_DB_NAME` selecciona
`hackbanorte`, donde se comprobó que existe el índice. Sin esta opción, la URI
actual seleccionaba `test`, que no contiene `documents`.

En Atlas, comprueba que el índice de la colección `documents` esté listo para
consultarse. Conserva su campo `autoEmbed` y su modelo, y agrega esta entrada a
su arreglo `fields` si no existe:

```json
{ "type": "filter", "path": "id_user" }
```

La definición completa preparada en [document_embedding.index.json](document_embedding.index.json)
conserva los modelos encontrados en Atlas: `voyage-4-large` para `content` y
`voyage-4` para `title`, y añade solamente el filtro. La inspección inicial
confirmó que el índice estaba `READY`, pero le faltaba ese filtro.

El filtro ya se aplicó en Atlas y el índice volvió a `READY` con
`queryable: true`. Se ejecutó la función real `vectorSearch` contra Atlas:
devolvió cuatro documentos con scores numéricos y se verificó que todos
pertenecían al usuario seleccionado. Esta comprobación cubre la recuperación;
la entrega a Gemini se validó con las pruebas locales descritas abajo.

El backend convierte el identificador del perfil a `ObjectId`, como lo define
el esquema, y lo usa como prefiltro. Esto busca los cinco mejores resultados
dentro de los documentos de ese usuario. No quites el filtro para resolver un
error de configuración: agrega `id_user` al índice y espera a que esté listo.

La consulta principal en `usecase/tools.uscase.ts` es:

```ts
{
  $vectorSearch: {
    index,
    path,
    query: text,
    numCandidates: 100,
    limit: 5,
    filter: { id_user: new Types.ObjectId(userId) },
  },
}
```

No se especifica `model`: Atlas usa el del índice. La búsqueda devuelve
`title`, `content`, `category` y `score`. Los resultados se pasan a Gemini en
cada mensaje, incluso en seguimientos. La caché global de respuestas ya no
interviene, porque no distingue el perfil ni los documentos recuperados.

## Comprobación

Desde `backend`, ejecuta `npm.cmd run dev` y envía un mensaje desde el chat con
un perfil que tenga documentos. Un arreglo vacío significa que no hubo
resultados para esa consulta y ese usuario; un error de Atlas no se convierte
silenciosamente en un arreglo vacío.

Pruebas locales con MongoDB y Gemini simulados, sin llamadas de red:

```powershell
node --require tsx/cjs --test tests/document-search.test.cjs
```

Estas pruebas validan el envío del texto, el filtro y el paso de documentos al
modelo. La compatibilidad y disponibilidad del índice requieren una consulta
real contra tu Atlas.

Documentación oficial:
[Automated Embedding](https://www.mongodb.com/docs/vector-search/crud-embeddings/automated-embedding/).
