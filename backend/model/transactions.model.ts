import { InferSchemaType, Types } from "mongoose";
import { model, Schema } from "mongoose";

const TransactionsSchema = new Schema(
  {
    id_user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { timestamps: true },
);

export type Transactions = InferSchemaType<typeof TransactionsSchema>;

// MODEL
export const TransactionsModel = model<Transactions>(
  "Transactions",
  TransactionsSchema,
);

export type CreateTransactionDTO = Omit<Transactions, "_id" | "updatedAt"> & {
  createdAt?: Date;
};

export const TransactionsDataAccess = {
  getTransactions: async (userId: string) => {
    return await TransactionsModel.find({ id_user: userId }).exec();
  },

  createTransaction: async (transactionData: CreateTransactionDTO) => {
    return await TransactionsModel.create({
      ...transactionData,
      createdAt: transactionData.createdAt ?? new Date(),
    });
  },

  getGroupedTransactions: async (
    userId: string,
  ): Promise<Record<string, number>> => {
    // 1. Buscamos la transacción más reciente para saber cuál es el "último mes registrado"
    const lastTransaction = await TransactionsModel.findOne({ id_user: userId })
      .sort({ createdAt: -1 })
      .exec();

    if (!lastTransaction) {
      return { income: 0, expenses: 0 };
    }

    const lastDate = lastTransaction.createdAt as Date;
    const year = lastDate.getUTCFullYear();
    const month = lastDate.getUTCMonth(); // 0-indexado

    const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));

    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

    // 2. Traemos solo las transacciones de ese mes
    const transactions = await TransactionsModel.find({
      id_user: userId,
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    }).exec();

    // 3. Acumulamos ingresos (amount > 0) y gastos (amount < 0)
    let incomeTotal = 0;
    let expensesTotal = 0;

    for (const tx of transactions) {
      if (tx.amount > 0) {
        incomeTotal += tx.amount;
      } else if (tx.amount < 0) {
        expensesTotal += Math.abs(tx.amount);
      }
    }

    // 4. Siempre mostramos la clave del mes, aunque uno de los dos sea 0
    return {
      income: incomeTotal,
      expenses: expensesTotal,
    };
  },
};
