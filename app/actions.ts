"use server";

import * as actions from "./actions/index";

export async function addTransaction(...args: Parameters<typeof actions.addTransaction>) {
  return actions.addTransaction(...args);
}

export async function deleteMultipleTransactions(...args: Parameters<typeof actions.deleteMultipleTransactions>) {
  return actions.deleteMultipleTransactions(...args);
}

export async function createCategory(...args: Parameters<typeof actions.createCategory>) {
  return actions.createCategory(...args);
}

export async function updateCategory(...args: Parameters<typeof actions.updateCategory>) {
  return actions.updateCategory(...args);
}

export async function deleteCategory(...args: Parameters<typeof actions.deleteCategory>) {
  return actions.deleteCategory(...args);
}

export async function createTransferTransaction(...args: Parameters<typeof actions.createTransferTransaction>) {
  return actions.createTransferTransaction(...args);
}

export async function updateTransaction(...args: Parameters<typeof actions.updateTransaction>) {
  return actions.updateTransaction(...args);
}

export async function removeTransaction(...args: Parameters<typeof actions.removeTransaction>) {
  return actions.removeTransaction(...args);
}

export async function addBankAccount(...args: Parameters<typeof actions.addBankAccount>) {
  return actions.addBankAccount(...args);
}

export async function updateBankAccount(...args: Parameters<typeof actions.updateBankAccount>) {
  return actions.updateBankAccount(...args);
}

export async function updateBankAccountBalance(...args: Parameters<typeof actions.updateBankAccountBalance>) {
  return actions.updateBankAccountBalance(...args);
}

export async function deleteBankAccount(...args: Parameters<typeof actions.deleteBankAccount>) {
  return actions.deleteBankAccount(...args);
}

export async function upsertBudgetItem(...args: Parameters<typeof actions.upsertBudgetItem>) {
  return actions.upsertBudgetItem(...args);
}

export async function addSavingsGoal(...args: Parameters<typeof actions.addSavingsGoal>) {
  return actions.addSavingsGoal(...args);
}

export async function updateSavingsGoal(...args: Parameters<typeof actions.updateSavingsGoal>) {
  return actions.updateSavingsGoal(...args);
}

export async function deleteSavingsGoal(...args: Parameters<typeof actions.deleteSavingsGoal>) {
  return actions.deleteSavingsGoal(...args);
}

export async function addUpcomingBill(...args: Parameters<typeof actions.addUpcomingBill>) {
  return actions.addUpcomingBill(...args);
}

export async function updateUpcomingBill(...args: Parameters<typeof actions.updateUpcomingBill>) {
  return actions.updateUpcomingBill(...args);
}

export async function deleteUpcomingBill(...args: Parameters<typeof actions.deleteUpcomingBill>) {
  return actions.deleteUpcomingBill(...args);
}

export async function getTelegramStatus(...args: Parameters<typeof actions.getTelegramStatus>) {
  return actions.getTelegramStatus(...args);
}

export async function generateTelegramPairingCode(...args: Parameters<typeof actions.generateTelegramPairingCode>) {
  return actions.generateTelegramPairingCode(...args);
}

export async function disconnectTelegram(...args: Parameters<typeof actions.disconnectTelegram>) {
  return actions.disconnectTelegram(...args);
}

export async function upsertStockHolding(...args: Parameters<typeof actions.upsertStockHolding>) {
  return actions.upsertStockHolding(...args);
}

export async function deleteStockHolding(...args: Parameters<typeof actions.deleteStockHolding>) {
  return actions.deleteStockHolding(...args);
}

export async function scanReceiptAction(...args: Parameters<typeof actions.scanReceiptAction>) {
  return actions.scanReceiptAction(...args);
}

export async function generateFinancialInsightsAction(...args: Parameters<typeof actions.generateFinancialInsightsAction>) {
  return actions.generateFinancialInsightsAction(...args);
}
