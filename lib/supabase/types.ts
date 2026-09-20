/**
 * Type definitions untuk Supabase Database.
 *
 * Idealnya file ini di-generate otomatis dengan perintah:
 *   npx supabase gen types typescript --project-id <your-project-ref> > lib/supabase/types.ts
 *
 * Setelah tabel dibuat di Supabase, ganti isi file ini dengan output
 * dari perintah gen types di atas agar type safety penuh.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Row types ──────────────────────────────────────────────────────────────
export interface BankAccountRow {
  id: string;
  user_id: string;
  name: string;
  bank_name: string;
  type: "bank" | "ewallet" | "cash";
  account_number: string | null;
  balance: number;
  color: string;
  logo: string;
  gradient: string[];
  created_at: string;
  updated_at: string;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  date: string;
  notes: string | null;
  bank_account_id: string;
  transfer_account_id: string | null;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  type: "income" | "expense";
  emoji: string;
  color: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetItemRow {
  id: string;
  user_id: string;
  category: string;
  label: string;
  spent: number;
  limit: number;
  color: string;
  created_at: string;
}

export interface SavingsGoalRow {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  emoji: string;
  created_at: string;
  updated_at: string;
}

export interface UpcomingBillRow {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  category: string;
  emoji: string;
  created_at: string;
}

// ── Insert types ───────────────────────────────────────────────────────────
export type TransactionInsert = Omit<TransactionRow, "created_at">;
export type CategoryInsert = Omit<CategoryRow, "created_at" | "updated_at">;
export type BankAccountInsert = Omit<BankAccountRow, "created_at" | "updated_at">;
export type BudgetItemInsert  = Omit<BudgetItemRow,  "created_at">;
export type SavingsGoalInsert = Omit<SavingsGoalRow, "created_at" | "updated_at">;
export type UpcomingBillInsert = Omit<UpcomingBillRow, "created_at">;

export interface StockHoldingRow {
  id: string;
  user_id: string;
  symbol: string;
  company_name: string;
  shares_count: number;
  avg_buy_price: number;
  current_price?: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type StockHoldingInsert = Omit<StockHoldingRow, "created_at" | "updated_at">;

// ── Database type (for Supabase generic) ──────────────────────────────────
export type Database = {
  public: {
    Tables: {
      bank_accounts: {
        Row: BankAccountRow;
        Insert: BankAccountInsert;
        Update: Partial<BankAccountInsert>;
      };
      transactions: {
        Row: TransactionRow;
        Insert: TransactionInsert;
        Update: Partial<TransactionInsert>;
      };
      categories: {
        Row: CategoryRow;
        Insert: CategoryInsert;
        Update: Partial<CategoryInsert>;
      };
      budget_items: {
        Row: BudgetItemRow;
        Insert: BudgetItemInsert;
        Update: Partial<BudgetItemInsert>;
      };
      savings_goals: {
        Row: SavingsGoalRow;
        Insert: SavingsGoalInsert;
        Update: Partial<SavingsGoalInsert>;
      };
      upcoming_bills: {
        Row: UpcomingBillRow;
        Insert: UpcomingBillInsert;
        Update: Partial<UpcomingBillInsert>;
      };
      stock_holdings: {
        Row: StockHoldingRow;
        Insert: StockHoldingInsert;
        Update: Partial<StockHoldingInsert>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
