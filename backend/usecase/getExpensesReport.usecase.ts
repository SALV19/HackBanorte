import { Types } from "mongoose";
import { TransactionsModel } from "../model/transactions.model";

export interface MonthlyPoint {
  year: number;
  month: number;
  total: number;
}

const MAX_MONTHS = 60;

function userObjectId(userId: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(userId)) throw new Error("Usuario inválido.");
  return new Types.ObjectId(userId);
}

/** Gastos de un mes, agrupados por categoría. Los importes de gasto son negativos. */
export async function getMonthlyExpenseReport(
  userId: string,
  { year, month }: { year: number; month: number },
) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("El periodo solicitado no es válido.");
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const rows = await TransactionsModel.aggregate<{ category: string; total: number }>([
    { $match: { id_user: userObjectId(userId), amount: { $lt: 0 }, createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: "$category", total: { $sum: { $abs: "$amount" } } } },
    { $project: { _id: 0, category: "$_id", total: { $round: ["$total", 2] } } },
    { $sort: { total: -1 } },
  ]).exec();

  return { year, month, total: rows.reduce((sum, row) => sum + row.total, 0), categories: rows };
}

/** Serie mensual completa (incluye meses sin movimientos) para ingresos o gastos. */
export async function getMonthlySeries(
  userId: string,
  kind: "incomes" | "expenses",
  requestedMonths: number,
): Promise<MonthlyPoint[]> {
  const months = Math.max(1, Math.min(MAX_MONTHS, Math.trunc(Number(requestedMonths) || 12)));
  const now = new Date();
  const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const amountMatch = kind === "incomes" ? { $gt: 0 } : { $lt: 0 };

  const rows = await TransactionsModel.aggregate<MonthlyPoint>([
    { $match: { id_user: userObjectId(userId), amount: amountMatch, createdAt: { $gte: firstMonth, $lt: end } } },
    { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, total: { $sum: kind === "incomes" ? "$amount" : { $abs: "$amount" } } } },
    { $project: { _id: 0, year: "$_id.year", month: "$_id.month", total: { $round: ["$total", 2] } } },
    { $sort: { year: 1, month: 1 } },
  ]).exec();

  const totals = new Map(rows.map((row) => [`${row.year}-${row.month}`, row.total]));
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth() + index, 1));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    return { year, month, total: totals.get(`${year}-${month}`) ?? 0 };
  });
}
