import { z } from 'zod';

export const CATALOG_ID = 'urn:hackbanorte:a2ui:report:v1';
export const sections = ['metrics', 'categories', 'monthly', 'transactions', 'documents', 'retirement'] as const;
export const intentSchema = z.enum(['general', 'gastos', 'ingresos', 'ahorro', 'retiro', 'documentos']);
export const planSchema = z.object({
  intent: intentSchema,
  query: z.string().min(1).max(2000),
  from: z.string().nullable(),
  to: z.string().nullable(),
  category: z.enum(['Salary', 'Refund', 'Investments', 'Freelance', 'Utilities', 'Health', 'Shopping', 'Entertainment', 'Food', 'Transport']).nullable(),
  sections: z.array(z.enum(sections)).min(1).max(6),
});
export const narrativeSchema = z.object({
  title: z.string().min(1).max(140),
  summary: z.string().min(1).max(3000),
  sections: z.array(z.enum(sections)).min(1).max(6),
  followUps: z.array(z.string().min(1).max(200)).max(3),
});
export type ReportPlan = z.infer<typeof planSchema>;
export type ReportNarrative = z.infer<typeof narrativeSchema>;
