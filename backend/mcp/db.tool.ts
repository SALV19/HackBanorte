import mongoose, { Types } from 'mongoose';
import type { ReportPlan } from '../views/a2ui.schema';
import { AppError } from '../types/error.type';

// Consultas fijas: el modelo elige filtros validados, nunca ejecuta Mongo arbitrario.
export function resolvePeriod(plan: Pick<ReportPlan, 'from' | 'to'>, now = new Date()) {
  const valid = (text: string | null) => {
    if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
    const date = new Date(text);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text;
  };
  const from = plan.from ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)).toISOString().slice(0, 10);
  const to = plan.to ?? now.toISOString().slice(0, 10);
  if (!valid(from) || !valid(to) || from > to) throw new AppError('El periodo solicitado no es válido', 'INVALID_PERIOD', 400);
  return { from, to };
}
export interface FinanceReport {
  totals: { income: number; expenses: number; balance: number; savingsRate: number | null; count: number };
  categories: { label: string; value: number }[];
  monthly: { label: string; income: number; expenses: number; balance: number }[];
  transactions: { date: string; category: string; reason: string; amount: number }[];
}
export async function getFinanceReport(userId: string, plan: ReportPlan, period: { from: string; to: string }): Promise<FinanceReport> {
  const db = mongoose.connection.db;
  if (!db) throw new AppError('La base de datos no está conectada', 'DATABASE_UNAVAILABLE', 503);
  const end = new Date(period.to);
  end.setUTCDate(end.getUTCDate() + 1);
  const income = { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] };
  const expense = { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] };
  const [result] = await db.collection('transactions').aggregate<{
    totals: { income: number; expenses: number; count: number }[];
    categories: FinanceReport['categories'];
    monthly: FinanceReport['monthly'];
    transactions: FinanceReport['transactions'];
  }>([
    { $match: {
      id_user: new Types.ObjectId(userId),
      createdAt: { $gte: new Date(period.from), $lt: end },
      ...(plan.category ? { category: plan.category } : {}),
    } },
    { $facet: {
      totals: [{ $group: { _id: null, income: { $sum: income }, expenses: { $sum: expense }, count: { $sum: 1 } } }],
      categories: [
        { $match: { amount: plan.intent === 'ingresos' ? { $gt: 0 } : { $lt: 0 } } },
        { $group: { _id: '$category', value: { $sum: { $abs: '$amount' } } } },
        { $sort: { value: -1 } },
        { $project: { _id: 0, label: '$_id', value: { $round: ['$value', 2] } } },
      ],
      monthly: [
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } }, income: { $sum: income }, expenses: { $sum: expense } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, label: '$_id', income: { $round: ['$income', 2] }, expenses: { $round: ['$expenses', 2] }, balance: { $round: [{ $subtract: ['$income', '$expenses'] }, 2] } } },
      ],
      transactions: [
        { $sort: { createdAt: -1, _id: -1 } }, { $limit: 50 },
        { $project: { _id: 0, date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, category: 1, reason: 1, amount: { $round: ['$amount', 2] } } },
      ],
    } },
  ], { maxTimeMS: 15000 }).toArray();
  const totals = result?.totals[0] ?? { income: 0, expenses: 0, count: 0 };
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    totals: { income: round(totals.income), expenses: round(totals.expenses), balance: round(totals.income - totals.expenses), savingsRate: totals.income ? round((totals.income - totals.expenses) / totals.income * 100) : null, count: totals.count },
    categories: result?.categories ?? [], monthly: result?.monthly ?? [], transactions: result?.transactions ?? [],
  };
}
