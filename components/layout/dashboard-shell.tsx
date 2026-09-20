"use client";

import { useState } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TransactionDialog } from "@/components/layout/transaction-dialog";
import type { BankAccountRow } from "@/lib/supabase/types";
import type { AvailableTransactionCategories } from "@/lib/supabase/queries";

interface DashboardShellProps {
  children: React.ReactNode;
  bankAccounts: BankAccountRow[];
  availableCategories: AvailableTransactionCategories;
}

export function DashboardShell({ children, bankAccounts, availableCategories }: DashboardShellProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="pb-24 lg:pb-0">{children}</div>
      <BottomNav onAddClick={() => setDialogOpen(true)} />
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bankAccounts={bankAccounts}
        availableCategories={availableCategories}
      />
    </>
  );
}
