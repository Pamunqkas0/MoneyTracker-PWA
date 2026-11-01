"use server";

import { revalidatePath } from "next/cache";
import { getFallbackCategoryMeta } from "@/lib/categories";

import { getAuthenticatedUserId } from "./_shared";

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
