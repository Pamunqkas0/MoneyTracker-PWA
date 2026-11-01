import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export type TransactionMutationValues = {
  name: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  date: string;
  notes?: string;
  bank_account_id: string;
  transfer_account_id?: string | null;
};

export type TransactionSnapshot = {
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

export async function getAuthenticatedUserId() {
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

export async function applyAccountDelta(
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

export async function applyBudgetDelta(
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

export function getAccountDelta(tx: Pick<TransactionMutationValues, "type" | "amount">) {
  return tx.type === "income" ? tx.amount : -tx.amount;
}

export function revalidateFinancePages() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/budget");
}

// ── Transaction Actions ──────────────────────────────────────────────────────
