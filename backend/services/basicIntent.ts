import type { ReportPlan } from '../views/a2ui.schema';

// Respaldo explícito para consultas habituales cuando el proveedor no está disponible.
export function basicIntent(content: string, previous?: { intent?: ReportPlan['intent']; period?: { from: string; to: string }; category?: ReportPlan['category']; query?: string }, now = new Date()): ReportPlan {
  const text = content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const intent = /retiro|pension|jubil|escenario/.test(text) ? 'retiro'
    : /gasto|gaste|egreso/.test(text) ? 'gastos'
    : /ingreso|gane|salario/.test(text) ? 'ingresos'
    : /ahorr/.test(text) ? 'ahorro'
    : /document|contrato|archivo/.test(text) ? 'documentos'
    : previous?.intent ?? 'general';
  let from: string | null = null;
  let to: string | null = null;
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const monthRange = (year: number, month: number) => {
    from = iso(new Date(Date.UTC(year, month, 1)));
    to = iso(new Date(Date.UTC(year, month + 1, 0)));
  };
  const dates = text.match(/\d{4}-\d{2}-\d{2}/g);
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const month = monthNames.findIndex(name => new RegExp(`\\b${name}\\b`).test(text));
  const year = Number(text.match(/\b(20\d{2})\b/)?.[1] ?? now.getUTCFullYear());
  const countMatch = text.match(/ultimos?\s+(\d+|dos|tres|seis|doce)\s+mes/);
  if (dates?.length) { from = dates[0]; to = dates[1] ?? dates[0]; }
  else if (month >= 0) monthRange(year, month);
  else if (/mes (pasado|anterior)/.test(text)) {
    const base = /anterior/.test(text) && previous?.period ? new Date(previous.period.from) : now;
    monthRange(base.getUTCFullYear(), base.getUTCMonth() - 1);
  } else if (/este mes|mes actual/.test(text)) monthRange(now.getUTCFullYear(), now.getUTCMonth());
  else if (countMatch) {
    const words: Record<string, number> = { dos: 2, tres: 3, seis: 6, doce: 12 };
    const count = Math.max(1, Math.min(120, words[countMatch[1]] ?? Number(countMatch[1])));
    from = iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count + 1, 1)));
    to = iso(now);
  } else if (/\b20\d{2}\b/.test(text)) { from = `${year}-01-01`; to = `${year}-12-31`; }
  else if (previous?.period) { from = previous.period.from; to = previous.period.to; }
  const aliases: [RegExp, NonNullable<ReportPlan['category']>][] = [
    [/comida|alimentacion|supermercado/, 'Food'], [/transporte/, 'Transport'], [/salud/, 'Health'],
    [/entretenimiento/, 'Entertainment'], [/compras/, 'Shopping'], [/servicios/, 'Utilities'],
    [/salario|sueldo/, 'Salary'], [/reembolso/, 'Refund'], [/freelance/, 'Freelance'], [/inversiones/, 'Investments'],
  ];
  const followUp = /mes anterior|^¿?y\b|movimientos en una tabla/.test(text);
  const category = aliases.find(([pattern]) => pattern.test(text))?.[1] ?? (followUp ? previous?.category ?? null : null);
  const sections: ReportPlan['sections'] = intent === 'documentos' ? ['documents']
    : intent === 'retiro' ? ['metrics', 'retirement', 'documents']
    : intent === 'gastos' || intent === 'ingresos' ? ['metrics', 'categories', 'monthly']
    : ['metrics', 'monthly', 'categories'];
  if (/tabla|movimiento|detalle/.test(text)) sections.push('transactions');
  const query = followUp && previous?.query ? `${previous.query}. Seguimiento: ${content}`.slice(-2000) : content;
  return { intent, query, from, to, category, sections };
}
