"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flag, Plus, PencilLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GoalDialog } from "./goal-dialog";
import { GoalDetailDialog } from "./goal-detail-dialog";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { SavingsGoalRow } from "@/lib/supabase/types";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";

export function GoalsTracker({ goals }: { goals: SavingsGoalRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoalRow | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoalRow | null>(null);

  const openAddDialog = () => {
    setEditingGoal(null);
    setDialogOpen(true);
  };

  const openEditDialog = (goal: SavingsGoalRow) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const openGoalDetail = (goal: SavingsGoalRow) => {
    setSelectedGoal(goal);
    setDetailDialogOpen(true);
  };

  const handleEditFromDetail = (goal: SavingsGoalRow) => {
    setDetailDialogOpen(false);
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="shadow-sm border-[var(--card-border)]">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Flag className="h-4 w-4 text-emerald-500" />
                Target Tabungan
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Progres menuju tujuan keuanganmu</CardDescription>
            </div>
            <button
              onClick={openAddDialog}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--muted)]/50 text-[var(--muted-foreground)] transition-colors hover:bg-emerald-500 hover:text-white cursor-pointer"
              aria-label="Tambah Target Baru"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4">
          <div className="flex flex-col gap-1">
            {goals.map((goal, i) => {
              const pct = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
              const done = pct >= 100;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.3 }}
                  onClick={() => openGoalDetail(goal)}
                  className={cn(
                    "py-3 flex flex-col gap-2 cursor-pointer hover:bg-black/[0.01] rounded-xl px-2 transition-all",
                    i < goals.length - 1 && "border-b border-[var(--card-border)]/50"
                  )}
                >
                  {/* Row 1: Emoji + Nama + Tanggal Target di Kiri | Persentase di Kanan */}
                  <div className="flex items-start justify-between gap-3 group/goal relative">
                    <div className="flex items-center gap-2 min-w-0">
                      <AnimatedEmoji emoji={goal.emoji} size={24} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate leading-tight">
                          {goal.name}
                        </p>
                        <p className="text-[11px] text-[var(--muted-foreground)] leading-tight mt-1">
                          Target &bull; {formatDate(goal.target_date, "MMM yyyy")}
                        </p>
                      </div>
                    </div>

                    {/* Persentase ditaruh di atas kanan agar simetris */}
                    <div className="shrink-0 ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditDialog(goal)}
                        className="h-6 w-6 hidden items-center justify-center rounded-md bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors hover:bg-emerald-500 hover:text-white sm:flex md:opacity-0 md:group-hover/goal:opacity-100 cursor-pointer"
                        aria-label="Edit Target"
                      >
                        <PencilLine className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => openEditDialog(goal)}
                        className="h-6 w-6 flex items-center justify-center rounded-md bg-[var(--muted)] text-[var(--muted-foreground)] sm:hidden cursor-pointer"
                        aria-label="Edit Target"
                      >
                        <PencilLine className="h-3 w-3" />
                      </button>
                      <span className={cn(
                        "text-xs sm:text-sm font-bold tabular-nums w-8 text-right block",
                        done ? "text-emerald-500" : "text-[var(--foreground)]"
                      )}>
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Progress bar */}
                  <Progress
                    value={pct}
                    indicatorColor={done ? "#10b981" : "#34d399"}
                    className="h-1.5 rounded-full"
                  />

                  {/* Row 3: Detail Angka Nominal */}
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[var(--muted-foreground)] tabular-nums font-medium">
                    <span>
                      Terkumpul: {formatCurrency(goal.current_amount, true)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="opacity-50">dari</span> 
                      <span className="text-[var(--foreground)] font-semibold">{formatCurrency(goal.target_amount, true)}</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Goal Detail View Modal (SavOr Style) */}
      <GoalDetailDialog
        goal={selectedGoal}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={handleEditFromDetail}
      />

      {/* Goal Form Dialog Modal */}
      <GoalDialog
        goal={editingGoal}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingGoal(null);
        }}
      />
    </motion.div>
  );
}