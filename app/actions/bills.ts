"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUserId } from "./_shared";

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
