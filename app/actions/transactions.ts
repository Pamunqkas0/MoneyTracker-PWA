"use server";

import { getAuthenticatedUserId, applyAccountDelta, applyBudgetDelta, getAccountDelta, revalidateFinancePages } from "./_shared";
import type { TransactionMutationValues } from "./_shared";
import type { TransactionSnapshot } from "./_shared";
import { revalidatePath } from "next/cache";
import { getFallbackCategoryMeta } from "@/lib/categories";

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
