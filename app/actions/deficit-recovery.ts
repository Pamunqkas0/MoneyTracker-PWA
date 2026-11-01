"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUserId } from "./_shared";
import type {
  DeficitRecoveryPlan,
  FlexibleBudgetRecommendation,
} from "@/lib/deficit-recovery-types";

type TransactionTotalRow = {
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
};

type BudgetRow = {
  category: string;
  label: string;
  limit: number;
  color: string;
};

type CategoryRow = {
  slug: string;
  name: string;
  color: string;
};

const FLEXIBLE_CATEGORY_PATTERN =
  /(makan|food|jajan|snack|belanja|shopping|hiburan|entertainment|kopi|coffee|ngopi|cafe|kafe|restoran|restaurant|dining)/i;

function monthBounds(month: number, year: number) {
  return {
    start: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10),
    end: new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10),
  };
}

function getMonthTotals(transactions: TransactionTotalRow[]) {
  return transactions.reduce(
    (totals, transaction) => {
      const amount = Number(transaction.amount) || 0;
      if (transaction.type === "income") totals.income += amount;
      if (transaction.type === "expense") totals.expenses += amount;
      return totals;
    },
    { income: 0, expenses: 0 }
  );
}

async function buildDeficitRecoveryPlan(
  month: number,
  year: number
): Promise<DeficitRecoveryPlan | null> {
  if (!Number.isInteger(month) || month < 0 || month > 11 || !Number.isInteger(year)) {
    return null;
  }

  const { supabase, userId } = await getAuthenticatedUserId();
  if (!userId) return null;

  const previousMonth = month === 0 ? 11 : month - 1;
  const previousYear = month === 0 ? year - 1 : year;
  const previousBounds = monthBounds(previousMonth, previousYear);
  const currentBounds = monthBounds(month, year);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const [previousResult, currentResult, budgetsResult, categoriesResult, goalsResult] =
    await Promise.all([
      client
        .from("transactions")
        .select("amount, type, category")
        .eq("user_id", userId)
        .gte("date", previousBounds.start)
        .lte("date", previousBounds.end),
      client
        .from("transactions")
        .select("amount, type, category")
        .eq("user_id", userId)
        .gte("date", currentBounds.start)
        .lte("date", currentBounds.end),
      client
        .from("budget_items")
        .select("category, label, limit, color")
        .eq("user_id", userId),
      client
        .from("categories")
        .select("slug, name, color")
        .eq("user_id", userId),
      client
        .from("savings_goals")
        .select("name, target_date")
        .eq("user_id", userId)
        .order("target_date", { ascending: false }),
    ]);

  if (previousResult.error || currentResult.error) {
    console.error(
      "[getDeficitRecoveryPlan]",
      previousResult.error?.message || currentResult.error?.message
    );
    return null;
  }

  const previousTransactions = (previousResult.data ?? []) as TransactionTotalRow[];
  const currentTransactions = (currentResult.data ?? []) as TransactionTotalRow[];
  const previousTotals = getMonthTotals(previousTransactions);
  const currentTotals = getMonthTotals(currentTransactions);
  const deficitAmount = Math.round(previousTotals.expenses - previousTotals.income);

  if (deficitAmount <= 0) return null;

  const previousCategorySpend = new Map<string, number>();
  const currentCategorySpend = new Map<string, number>();
  for (const transaction of previousTransactions) {
    if (transaction.type !== "expense" || !transaction.category) continue;
    previousCategorySpend.set(
      transaction.category,
      (previousCategorySpend.get(transaction.category) ?? 0) + Number(transaction.amount || 0)
    );
  }
  for (const transaction of currentTransactions) {
    if (transaction.type !== "expense" || !transaction.category) continue;
    currentCategorySpend.set(
      transaction.category,
      (currentCategorySpend.get(transaction.category) ?? 0) + Number(transaction.amount || 0)
    );
  }

  const budgets = (budgetsResult.data ?? []) as BudgetRow[];
  const categories = (categoriesResult.data ?? []) as CategoryRow[];
  const budgetByCategory = new Map(budgets.map((budget) => [budget.category, budget]));
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

  const flexibleCandidates = [...previousCategorySpend.entries()]
    .filter(([category]) => {
      const label = categoryBySlug.get(category)?.name ?? budgetByCategory.get(category)?.label ?? category;
      return FLEXIBLE_CATEGORY_PATTERN.test(`${category} ${label}`);
    })
    .sort((a, b) => b[1] - a[1]);

  let flexibleBudget: FlexibleBudgetRecommendation | null = null;
  for (const [category, previousSpend] of flexibleCandidates) {
    const existingBudget = budgetByCategory.get(category);
    const categoryMeta = categoryBySlug.get(category);
    const currentSpend = Math.round(currentCategorySpend.get(category) ?? 0);
    const currentLimit = Math.round(Number(existingBudget?.limit) || previousSpend);
    const requestedReduction = Math.min(Math.round(currentLimit * 0.15), deficitAmount);
    const proposedLimit = Math.max(currentSpend, currentLimit - requestedReduction);
    const reductionAmount = Math.max(0, currentLimit - proposedLimit);

    if (reductionAmount <= 0) continue;

    flexibleBudget = {
      category,
      label: categoryMeta?.name || existingBudget?.label || category,
      color: categoryMeta?.color || existingBudget?.color || "#E85024",
      previousSpend: Math.round(previousSpend),
      currentSpend,
      currentLimit,
      proposedLimit,
      reductionAmount,
      hasExistingBudget: Boolean(existingBudget),
    };
    break;
  }

  const goals = (goalsResult.data ?? []) as { name: string; target_date: string }[];
  const nonUrgentGoal = goals.find((goal) =>
    /(liburan|vacation|travel|gadget|wish|keinginan)/i.test(goal.name)
  ) ?? goals[0];
  const savingsGoal = nonUrgentGoal
    ? {
        name: nonUrgentGoal.name,
        suggestedAmount: Math.min(deficitAmount, Math.ceil(deficitAmount * 0.2)),
      }
    : null;

  const recoveredAmount = Math.min(
    deficitAmount,
    Math.max(0, Math.round(currentTotals.income - currentTotals.expenses))
  );

  return {
    currentMonth: month,
    currentYear: year,
    previousMonth,
    previousYear,
    deficitAmount,
    previousIncome: Math.round(previousTotals.income),
    previousExpenses: Math.round(previousTotals.expenses),
    currentIncome: Math.round(currentTotals.income),
    currentExpenses: Math.round(currentTotals.expenses),
    recoveredAmount,
    recoveryPercent: Math.min(100, Math.round((recoveredAmount / deficitAmount) * 100)),
    dailyRecoveryTarget: Math.ceil(deficitAmount / 30),
    flexibleBudget,
    savingsGoal,
  };
}

export async function getDeficitRecoveryPlan(month: number, year: number) {
  return buildDeficitRecoveryPlan(month, year);
}

export async function applyDeficitBudgetAdjustment(month: number, year: number) {
  const { supabase, userId } = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Sesi login tidak ditemukan." };

  const plan = await buildDeficitRecoveryPlan(month, year);
  const recommendation = plan?.flexibleBudget;
  if (!recommendation) {
    return { success: false, error: "Tidak ada budget fleksibel yang aman untuk disesuaikan." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const { data: existing, error: lookupError } = await client
    .from("budget_items")
    .select("id")
    .eq("user_id", userId)
    .eq("category", recommendation.category)
    .maybeSingle();

  if (lookupError) return { success: false, error: lookupError.message };

  const writeResult = existing
    ? await client
        .from("budget_items")
        .update({ limit: recommendation.proposedLimit })
        .eq("id", existing.id)
        .eq("user_id", userId)
    : await client.from("budget_items").insert({
        id: crypto.randomUUID(),
        user_id: userId,
        category: recommendation.category,
        label: recommendation.label,
        spent: recommendation.currentSpend,
        limit: recommendation.proposedLimit,
        color: recommendation.color,
      });

  if (writeResult.error) return { success: false, error: writeResult.error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budget");
  return { success: true, data: recommendation };
}
