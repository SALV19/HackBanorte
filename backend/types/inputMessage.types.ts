import { z } from "zod";
import { User } from "../model/user.model";

export const inputMessage = z.object({
  userName: z.string({
    message: "Debes seleccionar un perfil para poder interactuar con el chat",
  }),
  content: z.string({ message: "Contenido faltante, escribe un mensaje" }),
});
export type inputMessageType = z.infer<typeof inputMessage>;

export interface messageContent extends User {
  income: number;
  expenses: number;
  content: string;
}
