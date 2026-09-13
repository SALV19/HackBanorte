import { z } from "zod";
import { User } from "../model/user.model";

export const inputMessage = z.object({
  userName: z.string({
    message: "Debes seleccionar un perfil para poder interactuar con el chat",
  }),
  content: z.string({ message: "Contenido faltante, escribe un mensaje" }),
  conversationId: z.string().optional(),
  // true en la primera llamada que hace un cliente recién montado (su propio
  // MessageProcessor/SurfaceModel está vacío), sin importar si ya conoce un
  // conversationId de una sesión anterior guardado en el navegador — eso es
  // un detalle de Mongo que sobrevive a un F5, y es justo por eso que hace
  // falta esta bandera separada: el backend no puede inferir "cliente
  // fresco" solo de si la conversación ya existe.
  freshSurface: z.boolean().optional(),
});
export type inputMessageType = z.infer<typeof inputMessage>;

export interface messageContent extends User {
  income: number;
  expenses: number;
  content: string;
}
