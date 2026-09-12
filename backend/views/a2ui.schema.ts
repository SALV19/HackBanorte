// views/a2ui.schema.ts
//
// Schema de la interfaz declarativa (A2UI) que el backend le obliga a generar a
// Gemini. Nunca sale del backend como schema: solo viaja el JSON ya validado.
//
// Nota importante: se usa `z.enum(['texto'])` y no `z.literal('texto')` como
// discriminador. `z.literal` genera `{"const": "texto"}` en el JSON Schema, y
// `const` NO está dentro del subset que soporta `responseJsonSchema` de Gemini.
// `z.enum` con un solo valor genera `{"type":"string","enum":["texto"]}`, que sí
// está soportado, y el tipo inferido sigue siendo el literal.
import { z } from "zod";

const textoSchema = z.object({
  id: z.string(),
  tipo: z.enum(["texto"]),
  contenido: z.string(),
});

const tarjetaResultadoSchema = z.object({
  id: z.string(),
  tipo: z.enum(["tarjeta_resultado"]),
  titulo: z.string(),
  valor: z.string(),
});

const graficaSchema = z.object({
  id: z.string(),
  tipo: z.enum(["grafica"]),
  series: z.array(
    z.object({
      etiqueta: z.string(),
      valor: z.number(),
    }),
  ),
});

const formularioSchema = z.object({
  id: z.string(),
  tipo: z.enum(["formulario"]),
  campos: z.array(
    z.object({
      nombre: z.string(),
      etiqueta: z.string(),
      tipo: z.enum(["texto", "numero", "fecha"]),
    }),
  ),
});

const opcionesSchema = z.object({
  id: z.string(),
  tipo: z.enum(["opciones"]),
  pregunta: z.string(),
  opciones: z.array(
    z.object({
      id: z.string(),
      texto: z.string(),
    }),
  ),
});

const botonConfirmacionSchema = z.object({
  id: z.string(),
  tipo: z.enum(["boton_confirmacion"]),
  etiqueta: z.string(),
  accion: z.string(),
});

const componenteSchema = z.discriminatedUnion("tipo", [
  textoSchema,
  tarjetaResultadoSchema,
  graficaSchema,
  formularioSchema,
  opcionesSchema,
  botonConfirmacionSchema,
]);

export const a2uiSchema = z.object({
  mensaje: z.string().optional(),
  componentes: z.array(componenteSchema),
});

export type A2uiResponse = z.infer<typeof a2uiSchema>;
export type Componente = z.infer<typeof componenteSchema>;

// Lo que se le manda a Gemini en `responseJsonSchema`. Se quita `$schema`, que
// zod agrega en la raíz y Gemini rechaza.
const { $schema: _schema, ...jsonSchema } = z.toJSONSchema(a2uiSchema) as Record<
  string,
  unknown
>;

export const a2uiJsonSchema = jsonSchema;
