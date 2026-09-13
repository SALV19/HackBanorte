import { z } from "zod";
import { User } from "../model/user.model";
import type { RetrievedDocument } from "../usecase/tools.uscase";

export const inputMessage = z.object({
  userName: z.string({
    message: "Debes seleccionar un perfil para poder interactuar con el chat",
  }),
  content: z.string({ message: "Contenido faltante, escribe un mensaje" })
    .trim().min(1, "Contenido faltante, escribe un mensaje"),
  conversationId: z.string().optional(),
});
export type inputMessageType = z.infer<typeof inputMessage>;

export interface messageContent extends User {
  income: number;
  expenses: number;
  content: string;
  documents: RetrievedDocument[];
}
