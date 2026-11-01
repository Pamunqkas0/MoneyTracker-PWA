"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Plus, PencilLine, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, formatDate, daysUntil, cn } from "@/lib/utils";
import type { UpcomingBillRow } from "@/lib/supabase/types";
import { BillDialog } from "./bill-dialog";
import { deleteUpcomingBill } from "@/app/actions";
import { useRouter } from "next/navigation";

export function UpcomingBills({ bills }: { bills: UpcomingBillRow[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<UpcomingBillRow | null>(null);

  const billsWithDays = bills.map((bill) => ({
    ...bill,
    daysLeft: daysUntil(bill.due_date),
  })).sort((a, b) => a.daysLeft - b.daysLeft);

  const openAddDialog = () => {
    setEditingBill(null);
    setDialogOpen(true);
  };

  const openEditDialog = (bill: UpcomingBillRow) => {
    setEditingBill(bill);
    setDialogOpen(true);
  };

  const markAsPaid = async (bill: UpcomingBillRow) => {
    if (window.confirm(`Tandai tagihan ${bill.name} sebagai lunas? (Ini akan menghapus tagihan dari daftar ini)`)) {
      await deleteUpcomingBill(bill.id);
      router.refresh();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <Card className="shadow-sm border-[var(--card-border)]">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <CalendarClock className="h-4 w-4 text-blue-500" />
                Tagihan Mendatang
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {billsWithDays.filter((b) => b.daysLeft <= 7).length} tagihan jatuh tempo dalam 7 hari
              </CardDescription>
            </div>
            <button
              onClick={openAddDialog}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--muted)]/50 text-[var(--muted-foreground)] transition-colors hover:bg-blue-500 hover:text-white"
              aria-label="Tambah Tagihan Baru"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4">
          <div className="flex flex-col gap-1">
            {billsWithDays.length === 0 ? (
              <div className="py-6 text-center text-sm text-[var(--muted-foreground)]">
                Tidak ada tagihan mendatang.
              </div>
            ) : (
              billsWithDays.map((bill, i) => {
                const isUrgent = bill.daysLeft <= 3;
                const isWarning = bill.daysLeft <= 7 && bill.daysLeft > 3;
                
                let statusColor = "text-[var(--muted-foreground)]";
                if (isUrgent) statusColor = "text-rose-500 font-semibold";
                else if (isWarning) statusColor = "text-amber-500 font-medium";

                let statusText = `${bill.daysLeft} hari lagi`;
                if (bill.daysLeft === 0) statusText = "Hari ini!";
                if (bill.daysLeft < 0) statusText = `Terlambat ${Math.abs(bill.daysLeft)} hari!`;

                return (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * i, duration: 0.3 }}
                    className={cn(
                      "py-3 flex flex-col gap-2",
                      i < billsWithDays.length - 1 && "border-b border-[var(--card-border)]/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 group/bill relative">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg leading-none select-none shrink-0">{bill.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate leading-tight">
                            {bill.name}
                          </p>
                          <p className="text-[11px] text-[var(--muted-foreground)] leading-tight mt-1">
                            {formatDate(bill.due_date, "dd MMM yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-auto flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => openEditDialog(bill)}
                          className="h-6 w-6 hidden items-center justify-center rounded-md bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors hover:bg-blue-500 hover:text-white sm:flex md:opacity-0 md:group-hover/bill:opacity-100"
                          aria-label="Edit Tagihan"
                        >
                          <PencilLine className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => markAsPaid(bill)}
                          className="h-6 px-2 hidden items-center justify-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors hover:bg-emerald-500 hover:text-white sm:flex md:opacity-0 md:group-hover/bill:opacity-100 text-[10px] font-medium"
                          aria-label="Tandai Lunas"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Lunas</span>
                        </button>

                        <button
                          onClick={() => openEditDialog(bill)}
                          className="h-6 w-6 flex items-center justify-center rounded-md bg-[var(--muted)] text-[var(--muted-foreground)] sm:hidden"
                          aria-label="Edit Tagihan"
                        >
                          <PencilLine className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => markAsPaid(bill)}
                          className="h-6 w-6 flex items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 sm:hidden"
                          aria-label="Tandai Lunas"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </button>
                        <span className="text-xs sm:text-sm font-bold tabular-nums w-20 text-right block text-[var(--foreground)]">
                          {formatCurrency(bill.amount, true)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] tabular-nums font-medium">
                      <span className="text-[var(--muted-foreground)]">Status Tagihan:</span>
                      <span className={statusColor}>{statusText}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <BillDialog
        bill={editingBill}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingBill(null);
        }}
      />
    </motion.div>
  );
}