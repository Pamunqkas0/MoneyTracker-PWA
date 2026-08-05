"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFallbackCategoryMeta } from "@/lib/categories";

type TransactionMutationValues = {
  name: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  date: string;
  notes?: string;
  bank_account_id: string;
  transfer_account_id?: string | null;
};

type TransactionSnapshot = {
  id: string;
  name: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  date: string;
  notes: string | null;
  bank_account_id: string;
  transfer_account_id: string | null;
};

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, userId: null };
  }

  return { supabase, userId: user.id };
}

async function applyAccountDelta(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  accountId: string,
  delta: number
) {
  if (!delta) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: account, error } = await (supabase as any)
    .from("bank_accounts")
    .select("id, balance")
    .eq("id", accountId)
    .single();

  if (error || !account) {
    throw new Error(error?.message || "Rekening transaksi tidak ditemukan.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("bank_accounts")
    .update({
      balance: Number(account.balance) + delta,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

async function applyBudgetDelta(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  category: string,
  delta: number
) {
  if (!delta) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: budget, error } = await (supabase as any)
    .from("budget_items")
    .select("id, spent")
    .eq("category", category)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!budget) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("budget_items")
    .update({ spent: Math.max(0, Number(budget.spent) + delta) })
    .eq("id", budget.id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

function getAccountDelta(tx: Pick<TransactionMutationValues, "type" | "amount">) {
  return tx.type === "income" ? tx.amount : -tx.amount;
}

function revalidateFinancePages() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/budget");
}

// ── Transaction Actions ──────────────────────────────────────────────────────

export async function addTransaction(values: TransactionMutationValues) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // 1. Insert transaksi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("transactions")
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      name: values.name,
      amount: values.amount,
      type: values.type,
      category: values.category,
      date: values.date,
      notes: values.notes || null,
      bank_account_id: values.bank_account_id,
      transfer_account_id: values.transfer_account_id || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  try {
    await applyAccountDelta(supabase, values.bank_account_id, getAccountDelta(values));

    if (values.type === "expense") {
      await applyBudgetDelta(supabase, values.category, values.amount);
    }
  } catch (updateError) {
    return {
      success: false,
      error: updateError instanceof Error ? updateError.message : "Gagal memperbarui saldo rekening.",
    };
  }

  revalidateFinancePages();

  return { success: true, data };
}

export async function deleteMultipleTransactions(ids: string[]) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  if (!ids || ids.length === 0) {
    return { success: true };
  }

  // 1. Fetch all transactions first to rollback balances
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: txs, error: txError } = await (supabase as any)
    .from("transactions")
    .select("id, name, amount, type, category, date, notes, bank_account_id, transfer_account_id")
    .in("id", ids);

  if (txError || !txs) {
    return { success: false, error: txError?.message || "Gagal mengambil data transaksi." };
  }

  // 2. Delete all
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("transactions")
    .delete()
    .in("id", ids);

  if (error) {
    return { success: false, error: error.message };
  }

  // 3. Rollback balances & budgets sequentially
  try {
    for (const tx of txs) {
      const snapshot = tx as TransactionSnapshot;
      if (snapshot.type === "transfer") {
        await applyAccountDelta(supabase, snapshot.bank_account_id, snapshot.amount);
        if (snapshot.transfer_account_id) {
          await applyAccountDelta(supabase, snapshot.transfer_account_id, -snapshot.amount);
        }
      } else {
        await applyAccountDelta(supabase, snapshot.bank_account_id, -getAccountDelta(snapshot));
      }

      if (snapshot.type === "expense") {
        await applyBudgetDelta(supabase, snapshot.category, -snapshot.amount);
      }
    }
  } catch (updateError) {
    return {
      success: false,
      error: updateError instanceof Error ? updateError.message : "Gagal rollback saldo massal.",
    };
  }

  revalidateFinancePages();
  return { success: true };
}

export async function createCategory(values: {
  name: string;
  slug: string;
  type: "income" | "expense";
  emoji: string;
  color: string;
}) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  const normalizedSlug = values.slug.trim().toLowerCase();
  if (!normalizedSlug) {
    return { success: false, error: "Slug kategori tidak valid." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("categories")
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      slug: normalizedSlug,
      name: values.name.trim(),
      type: values.type,
      emoji: values.emoji,
      color: values.color,
      is_system: false,
    })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateFinancePages();
  revalidatePath("/dashboard/budget");
  return { success: true, data };
}

export async function updateCategory(
  id: string,
  values: {
    name: string;
    emoji: string;
    color: string;
  }
) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("categories")
    .update({
      name: values.name.trim(),
      emoji: values.emoji,
      color: values.color,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_system", false)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateFinancePages();
  revalidatePath("/dashboard/budget");
  return { success: true, data };
}

export async function deleteCategory(id: string) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // 1. Cek apakah ada transaksi dengan kategori ini
  // Kita harus mengambil slug dari kategori ini dulu
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: category } = await (supabase as any)
    .from("categories")
    .select("slug, is_system")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!category) {
    return { success: false, error: "Kategori tidak ditemukan." };
  }

  if (category.is_system) {
    return { success: false, error: "Kategori sistem tidak dapat dihapus." };
  }

  // Cek transaksi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error: countError } = await (supabase as any)
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("category", category.slug);

  if (countError) {
    return { success: false, error: countError.message };
  }

  if (count && count > 0) {
    return { success: false, error: `Kategori sedang digunakan oleh ${count} transaksi.` };
  }

  // Cek budget items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: budgetCount, error: budgetError } = await (supabase as any)
    .from("budget_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("category", category.slug);

  if (budgetError) {
    return { success: false, error: budgetError.message };
  }

  if (budgetCount && budgetCount > 0) {
    return { success: false, error: `Kategori sedang digunakan oleh ${budgetCount} item anggaran.` };
  }

  // 2. Hapus kategori
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: deleteError } = await (supabase as any)
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_system", false);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidateFinancePages();
  revalidatePath("/dashboard/budget");
  return { success: true };
}

export async function createTransferTransaction(values: {
  name: string;
  amount: number;
  date: string;
  notes?: string;
  from_bank_account_id: string;
  to_bank_account_id: string;
}) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  if (values.from_bank_account_id === values.to_bank_account_id) {
    return { success: false, error: "Rekening asal dan tujuan harus berbeda." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("transactions")
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      name: values.name,
      amount: values.amount,
      type: "transfer",
      category: "transfer",
      date: values.date,
      notes: values.notes || null,
      bank_account_id: values.from_bank_account_id,
      transfer_account_id: values.to_bank_account_id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  try {
    await applyAccountDelta(supabase, values.from_bank_account_id, -values.amount);
    await applyAccountDelta(supabase, values.to_bank_account_id, values.amount);
  } catch (updateError) {
    return {
      success: false,
      error: updateError instanceof Error ? updateError.message : "Gagal memindahkan saldo antar rekening.",
    };
  }

  revalidateFinancePages();
  return { success: true, data };
}

export async function updateTransaction(id: string, values: TransactionMutationValues) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  if (values.type === "transfer" && values.bank_account_id === values.transfer_account_id) {
    return { success: false, error: "Rekening asal dan tujuan harus berbeda." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: existingError } = await (supabase as any)
    .from("transactions")
    .select("id, name, amount, type, category, date, notes, bank_account_id, transfer_account_id")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return { success: false, error: existingError?.message || "Transaksi tidak ditemukan." };
  }

  const previous = existing as TransactionSnapshot;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("transactions")
    .update({
      name: values.name,
      amount: values.amount,
      type: values.type,
      category: values.category,
      date: values.date,
      notes: values.notes || null,
      bank_account_id: values.bank_account_id,
      transfer_account_id: values.transfer_account_id || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  const accountDeltas = new Map<string, number>();
  const applyDelta = (accountId: string | null | undefined, delta: number) => {
    if (!accountId || !delta) return;
    accountDeltas.set(accountId, (accountDeltas.get(accountId) || 0) + delta);
  };

  if (previous.type === "transfer") {
    applyDelta(previous.bank_account_id, previous.amount);
    applyDelta(previous.transfer_account_id, -previous.amount);
  } else {
    applyDelta(previous.bank_account_id, -getAccountDelta(previous));
  }

  if (values.type === "transfer") {
    applyDelta(values.bank_account_id, -values.amount);
    applyDelta(values.transfer_account_id, values.amount);
  } else {
    applyDelta(values.bank_account_id, getAccountDelta(values));
  }

  const budgetDeltas = new Map<string, number>();
  if (previous.type === "expense") {
    budgetDeltas.set(previous.category, (budgetDeltas.get(previous.category) || 0) - previous.amount);
  }
  if (values.type === "expense") {
    budgetDeltas.set(values.category, (budgetDeltas.get(values.category) || 0) + values.amount);
  }

  try {
    for (const [accountId, delta] of accountDeltas) {
      await applyAccountDelta(supabase, accountId, delta);
    }

    for (const [category, delta] of budgetDeltas) {
      await applyBudgetDelta(supabase, category, delta);
    }
  } catch (updateError) {
    return {
      success: false,
      error: updateError instanceof Error ? updateError.message : "Gagal sinkronkan saldo transaksi.",
    };
  }

  revalidateFinancePages();
  return { success: true, data };
}

// ── Bank Account Actions ────────────────────────────────────────────────────

export async function addBankAccount(values: {
  name: string;
  bank_name: string;
  type: "bank" | "ewallet" | "cash";
  account_number?: string;
  balance: number;
  color: string;
  logo: string;
  gradient: string[];
}) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("bank_accounts")
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      name: values.name,
      bank_name: values.bank_name,
      type: values.type,
      account_number: values.account_number || null,
      balance: values.balance,
      color: values.color,
      logo: values.logo,
      gradient: values.gradient,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function updateBankAccountBalance(values: {
  id: string;
  balance: number;
}) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  if (!values.id) {
    return { success: false, error: "Rekening tidak ditemukan." };
  }

  if (!Number.isFinite(values.balance) || values.balance < 0) {
    return { success: false, error: "Saldo harus berupa angka nol atau lebih." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("bank_accounts")
    .update({
      balance: values.balance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", values.id)
    .eq("user_id", userId)
    .select("id, balance")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, data };
}

// ── Delete Transaction ──────────────────────────────────────────────────────

export async function removeTransaction(id: string) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // Ambil data transaksi dulu untuk rollback saldo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tx, error: txError } = await (supabase as any)
    .from("transactions")
    .select("id, name, amount, type, category, date, notes, bank_account_id, transfer_account_id")
    .eq("id", id)
    .single();

  if (txError || !tx) {
    return { success: false, error: txError?.message || "Transaksi tidak ditemukan." };
  }

  const snapshot = tx as TransactionSnapshot;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  try {
    if (snapshot.type === "transfer") {
      await applyAccountDelta(supabase, snapshot.bank_account_id, snapshot.amount);
      if (snapshot.transfer_account_id) {
        await applyAccountDelta(supabase, snapshot.transfer_account_id, -snapshot.amount);
      }
    } else {
      await applyAccountDelta(supabase, snapshot.bank_account_id, -getAccountDelta(snapshot));
    }

    if (snapshot.type === "expense") {
      await applyBudgetDelta(supabase, snapshot.category, -snapshot.amount);
    }
  } catch (updateError) {
    return {
      success: false,
      error: updateError instanceof Error ? updateError.message : "Gagal memperbarui saldo setelah hapus transaksi.",
    };
  }

  revalidateFinancePages();
  return { success: true };
}

// ── Budget Actions ──────────────────────────────────────────────────────────

export async function upsertBudgetItem(category: string, limit: number) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // Ambil metadata kategori dari DB dulu, lalu fallback ke preset lokal.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: categoryRow } = await (supabase as any)
    .from("categories")
    .select("slug, name, color, type")
    .eq("slug", category)
    .eq("user_id", userId)
    .maybeSingle();

  const fallbackMeta = getFallbackCategoryMeta(category, "expense");
  const meta = {
    label: categoryRow?.name || fallbackMeta.name,
    color: categoryRow?.color || fallbackMeta.color,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("budget_items")
    .select("id")
    .eq("category", category)
    .maybeSingle();

  let error;
  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from("budget_items")
      .update({ limit })
      .eq("id", existing.id);
    error = err;
  } else {
    // Hitung spent aktual dari transaksi bulan ini
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: txs } = await (supabase as any)
      .from("transactions")
      .select("amount")
      .eq("type", "expense")
      .eq("category", category)
      .gte("date", start)
      .lte("date", end);
      
    const actualSpent = ((txs ?? []) as { amount: number }[]).reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from("budget_items")
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        category,
        label: meta.label,
        limit,
        spent: actualSpent,
        color: meta.color,
      });
    error = err;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budget");
  return { success: true };
}

// ── Savings Goals Actions ───────────────────────────────────────────────────

export async function addSavingsGoal(values: {
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  emoji: string;
}) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("savings_goals")
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      name: values.name,
      target_amount: values.target_amount,
      current_amount: values.current_amount,
      target_date: values.target_date,
      emoji: values.emoji,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function updateSavingsGoal(id: string, values: {
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  emoji: string;
}) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("savings_goals")
    .update({
      name: values.name,
      target_amount: values.target_amount,
      current_amount: values.current_amount,
      target_date: values.target_date,
      emoji: values.emoji,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function deleteSavingsGoal(id: string) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("savings_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// ── Upcoming Bills Actions ──────────────────────────────────────────────────

export async function addUpcomingBill(values: {
  name: string;
  amount: number;
  due_date: string;
  category: string;
  emoji: string;
}) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("upcoming_bills")
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      name: values.name,
      amount: values.amount,
      due_date: values.due_date,
      category: values.category,
      emoji: values.emoji,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function updateUpcomingBill(id: string, values: {
  name: string;
  amount: number;
  due_date: string;
  category: string;
  emoji: string;
}) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("upcoming_bills")
    .update({
      name: values.name,
      amount: values.amount,
      due_date: values.due_date,
      category: values.category,
      emoji: values.emoji,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function deleteUpcomingBill(id: string) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("upcoming_bills")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// ── Telegram Actions ──────────────────────────────────────────────────────────

export async function getTelegramStatus() {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = await (supabase as any)
    .from("profiles")
    .select("telegram_chat_id, telegram_pairing_code, telegram_pairing_expires_at")
    .eq("id", userId)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  const isConnected = !!profile?.telegram_chat_id;
  const isCodeActive = profile?.telegram_pairing_code && profile?.telegram_pairing_expires_at 
    ? new Date(profile.telegram_pairing_expires_at) > new Date()
    : false;

  return {
    success: true,
    isConnected,
    telegramChatId: profile?.telegram_chat_id || null,
    pairingCode: isCodeActive ? profile?.telegram_pairing_code : null,
  };
}

export async function generateTelegramPairingCode() {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // Generate 6-digit random code: MT-XXXXXX
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const code = `MT-${randomNum}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 menit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      telegram_pairing_code: code,
      telegram_pairing_expires_at: expiresAt,
    })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, code };
}

export async function disconnectTelegram() {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      telegram_chat_id: null,
      telegram_pairing_code: null,
      telegram_pairing_expires_at: null,
    })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

