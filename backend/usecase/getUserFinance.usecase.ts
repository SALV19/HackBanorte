import { TransactionsDataAccess } from "../model/transactions.model";

async function getUserFinance(userId: string) {
  const transactions =
    await TransactionsDataAccess.getGroupedTransactions(userId);

  return transactions;
}

export default getUserFinance;
