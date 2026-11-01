"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUserId, revalidateFinancePages } from "./_shared";

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

  revalidateFinancePages();
  return { success: true, data };
}

export async function updateBankAccount(values: {
  id: string;
  name: string;
  bank_name: string;
  type: "bank" | "ewallet" | "cash";
  account_number?: string | null;
  balance: number;
  color: string;
  logo: string;
  gradient: string[];
}) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  if (!values.id) {
    return { success: false, error: "Rekening tidak ditemukan." };
  }

  if (!values.name?.trim()) {
    return { success: false, error: "Nama rekening tidak boleh kosong." };
  }

  if (!Number.isFinite(values.balance) || values.balance < 0) {
    return { success: false, error: "Saldo harus berupa angka nol atau lebih." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("bank_accounts")
    .update({
      name: values.name.trim(),
      bank_name: values.bank_name,
      type: values.type,
      account_number: values.account_number?.trim() || null,
      balance: values.balance,
      color: values.color,
      logo: values.logo,
      gradient: values.gradient,
      updated_at: new Date().toISOString(),
    })
    .eq("id", values.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateFinancePages();
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

  revalidateFinancePages();
  return { success: true, data };
}

export async function deleteBankAccount(id: string) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  if (!id) {
    return { success: false, error: "Rekening tidak ditemukan." };
  }

  // Cek apakah ada riwayat transaksi yang terhubung dengan rekening ini
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error: countError } = await (supabase as any)
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .or(`bank_account_id.eq.${id},transfer_account_id.eq.${id}`);

  if (countError) {
    return { success: false, error: countError.message };
  }

  if (count && count > 0) {
    return {
      success: false,
      error: `Rekening tidak dapat dihapus karena memiliki ${count} riwayat transaksi. Hapus atau pindahkan transaksi tersebut terlebih dahulu.`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("bank_accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateFinancePages();
  return { success: true };
}

// ── Delete Transaction ──────────────────────────────────────────────────────
