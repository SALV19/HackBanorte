import { z } from 'zod';

export const simulationSchema = z.object({
  initialSavings: z.number().finite().min(0).max(1e10),
  monthlyContribution: z.number().finite().min(0).max(1e8),
  annualRate: z.number().finite().min(0).max(30),
  years: z.number().int().min(1).max(60),
});
export const inputMessage = z.object({
  userName: z.string().trim().min(1, 'Selecciona un perfil').max(120),
  content: z.string().trim().min(1, 'Escribe un mensaje').max(4000),
  conversationId: z.string().regex(/^[a-f\d]{24}$/i, 'Conversación inválida').optional(),
  simulation: simulationSchema.optional(),
});
export type inputMessageType = z.infer<typeof inputMessage>;
