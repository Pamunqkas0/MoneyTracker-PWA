"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUserId } from "./_shared";

export async function upsertStockHolding(values: {
  id?: string;
  symbol: string;
  company_name: string;
  shares_count: number;
  avg_buy_price: number;
  current_price?: number;
  notes?: string;
}) {
  const { supabase, userId } = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  const holdingId = values.id || crypto.randomUUID();
  const cleanSymbol = values.symbol.toUpperCase().trim().replace("IDX:", "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("stock_holdings")
    .upsert({
      id: holdingId,
      user_id: userId,
      symbol: cleanSymbol,
      company_name: values.company_name || cleanSymbol,
      shares_count: Number(values.shares_count),
      avg_buy_price: Number(values.avg_buy_price),
      current_price: values.current_price ? Number(values.current_price) : Number(values.avg_buy_price),
      notes: values.notes || null,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteStockHolding(id: string) {
  const { supabase, userId } = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("stock_holdings")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
