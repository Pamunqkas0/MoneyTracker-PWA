"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  PencilLine,
  CheckCircle2,
  ReceiptText,
} from "lucide-react";
import { formatCurrency, formatDate, daysUntil, cn } from "@/lib/utils";
import type { UpcomingBillRow } from "@/lib/supabase/types";
import { BillDialog } from "./bill-dialog";
import { deleteUpcomingBill } from "@/app/actions";

interface UpcomingBillsBentoProps {
  bills: UpcomingBillRow[];
}

const PASTEL_AVATAR_BGS = [
  "bg-[#F8D8CE] text-[#C23B10]", // Soft peach
  "bg-[#E8F8B8] text-[#3D7816]", // Mint green
  "bg-[#BCE0E6] text-[#1E5F6E]", // Soft sky blue
  "bg-[#FAD170] text-[#7A5300]", // Soft amber
  "bg-[#E2D9F3] text-[#553C9A]", // Soft lavender
];

export function UpcomingBillsBento({ bills = [] }: UpcomingBillsBentoProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<UpcomingBillRow | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const billsWithDays = bills
    .map((bill) => ({
      ...bill,
      daysLeft: daysUntil(bill.due_date),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const overdueCount = billsWithDays.filter((b) => b.daysLeft < 0).length;

  const openAddDialog = () => {
    setEditingBill(null);
    setDialogOpen(true);
  };

  const openEditDialog = (bill: UpcomingBillRow) => {
    setEditingBill(bill);
    setDialogOpen(true);
  };

  const markAsPaid = async (bill: UpcomingBillRow) => {
    if (processingId) return;
    if (window.confirm(`Tandai tagihan "${bill.name}" sebagai lunas?`)) {
      setProcessingId(bill.id);
      try {
        await deleteUpcomingBill(bill.id);
        router.refresh();
      } finally {
        setProcessingId(null);
      }
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-[#1C1E23] rounded-[32px] p-4.5 sm:p-5 shadow-xs flex flex-col gap-3.5 border border-black/[0.02] dark:border-white/[0.06] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
        {/* ── HEADER RINGKAS & CLEAN ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#111111] dark:text-white tracking-tight">
              Tagihan
            </h3>
            {overdueCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-black tracking-tight shrink-0">
                {overdueCount} Terlambat
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openAddDialog}
              type="button"
              className="w-7 h-7 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-200 hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Tambah Tagihan"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <Link
              href="/dashboard/budget"
              className="text-xs font-extrabold text-[#E85024] hover:underline"
            >
              Semua
            </Link>
          </div>
        </div>

        {/* ── LIST OF BILLS (KOMPAK, RAPI, TIDAK AKAN WRAPPING) ── */}
        <div className="flex flex-col gap-2">
          {billsWithDays.length === 0 ? (
            <div className="py-5 px-3 rounded-2xl bg-[#FBF9F5] dark:bg-slate-900/40 border border-dashed border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
              <span className="font-medium">Tidak ada tagihan aktif</span>
              <button
                onClick={openAddDialog}
                type="button"
                className="text-[11px] font-extrabold text-[#E85024] hover:underline"
              >
                + Tambah
              </button>
            </div>
          ) : (
            billsWithDays.slice(0, 3).map((bill, index) => {
              const isOverdue = bill.daysLeft < 0;
              const isToday = bill.daysLeft === 0;
              const isUrgent = bill.daysLeft <= 3 && bill.daysLeft >= 0;

              const avatarBg = PASTEL_AVATAR_BGS[index % PASTEL_AVATAR_BGS.length];

              const statusText = isOverdue
                ? `${formatDate(bill.due_date, "dd MMM")} • Terlambat ${Math.abs(bill.daysLeft)}h`
                : isToday
                ? `${formatDate(bill.due_date, "dd MMM")} • Hari ini`
                : isUrgent
                ? `${formatDate(bill.due_date, "dd MMM")} • ${bill.daysLeft}h lagi`
                : `${formatDate(bill.due_date, "dd MMM")} • ${bill.daysLeft} hari`;

              return (
                <div
                  key={bill.id}
                  className="rounded-2xl bg-[#FBF9F5] dark:bg-slate-900/60 p-3 border border-black/[0.03] dark:border-slate-800/80 hover:bg-[#F6F2E9] dark:hover:bg-slate-800/90 transition-all flex flex-col gap-2 group/bill shadow-2xs"
                >
                  {/* BARIS 1: Avatar + Nama Tagihan vs Nominal */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-2xs shrink-0 select-none",
                          avatarBg
                        )}
                      >
                        {bill.emoji || "🧾"}
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-[#111111] dark:text-slate-100 truncate block">
                        {bill.name}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-xs sm:text-sm font-black text-[#111111] dark:text-white tracking-tight tabular-nums block">
                        {formatCurrency(bill.amount, true)}
                      </span>
                    </div>
                  </div>

                  {/* BARIS 2: Single-line Status Pill vs Quick Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/[0.03] dark:border-slate-800/60">
                    {/* Status Pill Badge (Inline, no wrap) */}
                    <div className="min-w-0 flex-1 truncate">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full inline-block truncate max-w-full",
                          isOverdue
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                            : isToday
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                            : isUrgent
                            ? "bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300"
                            : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300"
                        )}
                      >
                        {statusText}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditDialog(bill)}
                        type="button"
                        className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors shadow-2xs border border-black/[0.04] dark:border-slate-700 cursor-pointer"
                        title="Edit"
                      >
                        <PencilLine className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => markAsPaid(bill)}
                        type="button"
                        disabled={processingId === bill.id}
                        className="h-6 px-2 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center gap-1 text-[10px] font-extrabold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                        title="Tandai Lunas"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>Lunas</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <BillDialog
        bill={editingBill}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingBill(null);
        }}
      />
    </>
  );
}
