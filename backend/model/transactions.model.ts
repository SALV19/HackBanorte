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
  getMonthlyExpenses: async (userId: string) => {
    return await TransactionsModel.find({ id_user: userId }).exec();
  },

  createTransaction: async (transactionData: CreateTransactionDTO) => {
    return await TransactionsModel.create({
      ...transactionData,
      createdAt: transactionData.createdAt ?? new Date(),
    });
  },
};
