/**
 * lib/supabase/queries.ts
 *
 * Semua fungsi fetch data dari Supabase.
 * Gunakan fungsi-fungsi ini di Server Components atau Server Actions
 * untuk menggantikan import dari "@/lib/mock-data".
 */

import { createClient } from "./server";
import { getFallbackCategoryMeta } from "@/lib/categories";
import type {
  TransactionRow,
  BankAccountRow,
  CategoryRow,
  BudgetItemRow,
  SavingsGoalRow,
  UpcomingBillRow,
} from "./types";

export interface CategoryOption {
  id: string;
  slug: string;
  name: string;
  type: "income" | "expense";
  emoji: string;
  color: string;
  is_system?: boolean;
}

export interface AvailableTransactionCategories {
  income: CategoryOption[];
  expense: CategoryOption[];
  bySlug: Record<string, CategoryOption>;
}

function normalizeCategoryOption(category: CategoryOption) {
  return {
    ...category,
    is_system: category.is_system ?? false,
  };
}

function createSyntheticCategory(slug: string, type: "income" | "expense"): CategoryOption {
  const fallback = getFallbackCategoryMeta(slug, type);
  return {
    id: `synthetic-${type}-${slug}`,
    slug,
    name: fallback.name,
    type,
    emoji: fallback.emoji,
    color: fallback.color,
    is_system: false,
  };
}

// Helper internal untuk generate string ISO batas awal dan akhir bulan (YYYY-MM-DD)
function getMonthBounds(month?: number, year?: number) {
  const now = new Date();
  const targetMonth = month !== undefined ? month : now.getMonth();
  const targetYear = year !== undefined ? year : now.getFullYear();

  const start = new Date(targetYear, targetMonth, 1).toISOString().slice(0, 10);
  const end = new Date(targetYear, targetMonth + 1, 0).toISOString().slice(0, 10);

  return { start, end };
}

// ── Transactions ────────────────────────────────────────────────────────────

/**
 * Ambil semua transaksi berdasarkan filter bulan dan tahun tertentu.
 */
export async function getTransactions(month?: number, year?: number, limit = 50): Promise<TransactionRow[]> {
  const supabase = await createClient();
  const { start, end } = getMonthBounds(month, year);

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getTransactions]", error.message);
    return [];
  }
  return (data ?? []) as TransactionRow[];
}

/**
 * Ambil transaksi yang baru ditambahkan dalam 24 jam terakhir.
 */
export async function getRecentTransactions24h(limit = 10): Promise<TransactionRow[]> {
  const supabase = await createClient();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("created_at", yesterday)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentTransactions24h]", error.message);
    return [];
  }
  return (data ?? []) as TransactionRow[];
}

export async function getCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("type", { ascending: true })
    .order("is_system", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getCategories]", error.message);
    return [];
  }

  return (data ?? []) as CategoryRow[];
}

export async function getAvailableTransactionCategories(): Promise<AvailableTransactionCategories> {
  const supabase = await createClient();

  const [categoriesResult, transactionsResult, budgetResult] = await Promise.all([
    supabase.from("categories").select("*"),
    supabase
      .from("transactions")
      .select("category, type")
      .in("type", ["income", "expense"])
      .limit(1000),
    supabase.from("budget_items").select("category"),
  ]);

  const bySlug = new Map<string, CategoryOption>();
  const incomeCategories: CategoryOption[] = [];
  const expenseCategories: CategoryOption[] = [];

  const addCategory = (category: CategoryOption, isSelectable = true) => {
    const normalized = normalizeCategoryOption(category);
    const existing = bySlug.get(normalized.slug);
    if (!existing) {
      bySlug.set(normalized.slug, normalized);
    }

    if (isSelectable) {
      if (normalized.type === "income" && !incomeCategories.some((item) => item.slug === normalized.slug)) {
        incomeCategories.push(normalized);
      }
      if (normalized.type === "expense" && !expenseCategories.some((item) => item.slug === normalized.slug)) {
        expenseCategories.push(normalized);
      }
    }
    return existing ?? normalized;
  };

  if (!categoriesResult.error) {
    const categories = (categoriesResult.data ?? []) as CategoryRow[];
    categories.forEach((category) => {
      addCategory(
        {
          id: category.id,
          slug: category.slug,
          name: category.name,
          type: category.type,
          emoji: category.emoji,
          color: category.color,
          is_system: category.is_system,
        },
        true
      );
    });
  } else {
    console.error("[getAvailableTransactionCategories.categories]", categoriesResult.error.message);
  }

  if (!transactionsResult.error) {
    const transactions = (transactionsResult.data ?? []) as Pick<TransactionRow, "category" | "type">[];

    transactions.forEach((tx) => {
      if (!tx.category) return;
      if ((tx.type === "income" || tx.type === "expense") && !bySlug.has(tx.category)) {
        addCategory(createSyntheticCategory(tx.category, tx.type), false);
      }
    });
  } else {
    console.error("[getAvailableTransactionCategories.transactions]", transactionsResult.error.message);
  }

  if (!budgetResult.error) {
    const budgetCategories = (budgetResult.data ?? []) as Pick<BudgetItemRow, "category">[];
    budgetCategories.forEach((item) => {
      if (item.category && !bySlug.has(item.category)) {
        addCategory(createSyntheticCategory(item.category, "expense"), false);
      }
    });
  } else {
    console.error("[getAvailableTransactionCategories.budget_items]", budgetResult.error.message);
  }

  return {
    income: incomeCategories,
    expense: expenseCategories,
    bySlug: Object.fromEntries(Array.from(bySlug.entries())),
  };
}

/**
 * Tambah transaksi baru.
 */
export async function insertTransaction(values: {
  name: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string;
  bank_account_id: string;
}): Promise<TransactionRow> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Anda harus login terlebih dahulu.");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("transactions")
    .insert({ id: crypto.randomUUID(), user_id: user.id, ...values })
    .select()
    .single();

  if (error) throw new Error(String(error.message));
  return data as TransactionRow;
}

/**
 * Hapus transaksi berdasarkan id.
 */
export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Bank Accounts ───────────────────────────────────────────────────────────

/**
 * Ambil semua rekening bank/e-wallet.
 */
export async function getBankAccounts(): Promise<BankAccountRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getBankAccounts]", error.message);
    return [];
  }
  return (data ?? []) as BankAccountRow[];
}

/**
 * Update saldo rekening.
 */
export async function updateBankBalance(id: string, balance: number): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("bank_accounts")
    .update({ balance, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(String(error.message));
}

// ── Budget Items ────────────────────────────────────────────────────────────

/**
 * Ambil semua budget kategori dengan spent yang dihitung dari transaksi bulan tersebut.
 */
export async function getBudgetItems(month?: number, year?: number): Promise<BudgetItemRow[]> {
  const supabase = await createClient();
  const { start, end } = getMonthBounds(month, year);

  // Ambil semua budget items
  const { data: budgetItems, error: budgetError } = await supabase
    .from("budget_items")
    .select("*")
    .order("created_at", { ascending: true });

  if (budgetError) {
    console.error("[getBudgetItems]", budgetError.message);
    return [];
  }

  // Ambil transaksi expense bulan tersebut
  const { data: transactions, error: txError } = (await supabase
    .from("transactions")
    .select("amount, category, type")
    .eq("type", "expense")
    .gte("date", start)
    .lte("date", end)) as { data: { amount: number; category: string }[] | null, error: any };

  if (txError) {
    console.error("[getBudgetItems transactions]", txError.message);
    return (budgetItems ?? []) as BudgetItemRow[];
  }

  // Hitung total expense per kategori
  const categorySpent = new Map<string, number>();
  (transactions ?? []).forEach((tx) => {
    categorySpent.set(tx.category, (categorySpent.get(tx.category) || 0) + tx.amount);
  });

  // Merge spent dari transaksi ke budget items
  const items = budgetItems as BudgetItemRow[] | null;
  const result = (items ?? []).map((item: BudgetItemRow) => ({
    ...item,
    spent: categorySpent.get(item.category) || 0,
  }));

  return result;
}

/**
 * Update jumlah yang sudah digunakan (spent) pada sebuah budget item.
 */
export async function updateBudgetSpent(id: string, spent: number): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("budget_items")
    .update({ spent })
    .eq("id", id);
  if (error) throw new Error(String(error.message));
}

// ── Savings Goals ───────────────────────────────────────────────────────────

/**
 * Ambil semua target tabungan.
 */
export async function getSavingsGoals(): Promise<SavingsGoalRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .order("target_date", { ascending: true });

  if (error) {
    console.error("[getSavingsGoals]", error.message);
    return [];
  }
  return (data ?? []) as SavingsGoalRow[];
}

/**
 * Update jumlah tabungan saat ini pada sebuah target.
 */
export async function updateSavingsGoalAmount(id: string, current_amount: number): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("savings_goals")
    .update({ current_amount, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(String(error.message));
}

// ── Upcoming Bills ──────────────────────────────────────────────────────────

/**
 * Ambil tagihan yang akan datang, diurutkan dari yang paling dekat jatuh tempo.
 */
export async function getUpcomingBills(): Promise<UpcomingBillRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("upcoming_bills")
    .select("*")
    .order("due_date", { ascending: true });

  if (error) {
    console.error("[getUpcomingBills]", error.message);
    return [];
  }
  return (data ?? []) as UpcomingBillRow[];
}

// ── Financial Summary ───────────────────────────────────────────────────────

/**
 * Hitung ringkasan keuangan secara real-time berdasarkan parameter bulan & tahun aktif.
 */
export async function getFinancialSummary(month?: number, year?: number) {
  const supabase = await createClient();
  const currentDate = new Date();
  const m = month ?? currentDate.getMonth();
  const y = year ?? currentDate.getFullYear();
  
  const { start, end } = getMonthBounds(m, y);
  
  const prevMonth = m === 0 ? 11 : m - 1;
  const prevYear = m === 0 ? y - 1 : y;
  const { start: prevStart, end: prevEnd } = getMonthBounds(prevMonth, prevYear);

  const [txResult, prevTxResult, bankResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, type")
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("transactions")
      .select("amount, type")
      .gte("date", prevStart)
      .lte("date", prevEnd),
    supabase.from("bank_accounts").select("balance"),
  ]);

  const transactions = (txResult.data ?? []) as Pick<TransactionRow, "amount" | "type">[];
  const prevTransactions = (prevTxResult.data ?? []) as Pick<TransactionRow, "amount" | "type">[];
  const bankAccounts = (bankResult.data ?? []) as Pick<BankAccountRow, "balance">[];

  const totalBalance = bankAccounts.reduce((sum, b) => sum + b.balance, 0);
  
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const prevTotalIncome = prevTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const prevTotalExpenses = prevTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;
  
  // Calculate Growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const incomeGrowth = calculateGrowth(totalIncome, prevTotalIncome);
  const expenseGrowth = calculateGrowth(totalExpenses, prevTotalExpenses);
  
  // Estimate previous balance (current balance - this month's net cashflow)
  const prevTotalBalance = totalBalance - totalSavings;
  const balanceGrowth = calculateGrowth(totalBalance, prevTotalBalance);

  return {
    totalBalance,
    totalIncome,
    totalExpenses,
    totalSavings,
    savingsRate,
    balanceGrowth,
    incomeGrowth,
    expenseGrowth,
  };
}

// ── Chart Compute ───────────────────────────────────────────────────────────

/**
 * Hitung data pemasukan & pengeluaran per bulan untuk tren tahunan CashflowChart.
 */
export async function getMonthlyData() {
  const supabase = await createClient();
  const { data, error } = (await supabase
    .from("transactions")
    .select("amount, type, date")
    .order("date", { ascending: true })) as { data: { amount: number; type: string; date: string }[] | null, error: any };

  if (error || !data) return [];

  const monthlyMap = new Map<string, { month: string; income: number; expense: number }>();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  data.forEach((tx) => {
    if (tx.type === "transfer") return;

    const d = new Date(tx.date);
    const monthStr = monthNames[d.getMonth()];

    if (!monthlyMap.has(monthStr)) {
      monthlyMap.set(monthStr, { month: monthStr, income: 0, expense: 0 });
    }

    const entry = monthlyMap.get(monthStr)!;
    if (tx.type === "income") entry.income += tx.amount;
    if (tx.type === "expense") entry.expense += tx.amount;
  });

  return Array.from(monthlyMap.values());
}

/**
 * Hitung distribusi pengeluaran berdasarkan kategori untuk filter bulan & tahun terpilih.
 */
export async function getCategoryExpenses(month?: number, year?: number) {
  const supabase = await createClient();
  const { start, end } = getMonthBounds(month, year);

  const [txResult, catResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, category")
      .eq("type", "expense")
      .gte("date", start)
      .lte("date", end),
    supabase.from("categories").select("slug, name, color"),
  ]);

  if (txResult.error || !txResult.data) return [];

  const transactions = txResult.data as unknown as { amount: number; category: string }[];
  const categories = (catResult.data ?? []) as unknown as { slug: string; name: string; color: string }[];

  const categoryMap = new Map<string, { label: string; color: string }>();
  categories.forEach((c) => {
    categoryMap.set(c.slug, { label: c.name, color: c.color });
  });

  const totalExpense = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  if (totalExpense === 0) return [];

  const map = new Map<string, number>();
  transactions.forEach((tx) => {
    const key = (tx.category && tx.category.trim()) ? tx.category.trim() : "other";
    map.set(key, (map.get(key) || 0) + tx.amount);
  });

  const result = Array.from(map.entries()).map(([category, amount]) => {
    const existing = categoryMap.get(category);
    const fallback = getFallbackCategoryMeta(category, "expense");
    const label = existing?.label || fallback.name || "Lainnya";
    const color = existing?.color || fallback.color || "#94a3b8";

    return {
      category: category as any,
      label,
      amount,
      percentage: Number(((amount / totalExpense) * 100).toFixed(1)),
      color,
    };
  });

  return result.sort((a, b) => b.amount - a.amount);
}
