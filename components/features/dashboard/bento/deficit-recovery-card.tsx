"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  PiggyBank,
  ShieldAlert,
  ShoppingBag,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { applyDeficitBudgetAdjustment } from "@/app/actions/deficit-recovery";
import { TactileIconBadge } from "@/components/ui/tactile-icon-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import type { DeficitRecoveryPlan } from "@/lib/deficit-recovery-types";

interface DeficitRecoveryCardProps {
  plan: DeficitRecoveryPlan | null;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function DeficitRecoveryCard({ plan }: DeficitRecoveryCardProps) {
  const router = useRouter();
  const [dismissalLoaded, setDismissalLoaded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState(0);
  const [error, setError] = useState("");
  const prefersReducedMotion = useReducedMotion();

  const dismissalKey = plan
    ? `deficit-recovery-dismissed-${plan.previousYear}-${plan.previousMonth}`
    : "deficit-recovery-dismissed-none";

  useEffect(() => {
    setDismissed(window.localStorage.getItem(dismissalKey) === "true");
    setDismissalLoaded(true);
  }, [dismissalKey]);

  if (!plan || !dismissalLoaded || dismissed) return null;

  const periodLabel = `${MONTH_NAMES[plan.previousMonth]} ${plan.previousYear}`;
  const flexible = plan.flexibleBudget;
  const recommendations = [
    {
      icon: <ShoppingBag className="h-5 w-5" aria-hidden="true" />,
      title: flexible ? `Pangkas ${flexible.label}` : "Pangkas pos fleksibel",
      description: flexible
        ? `Hemat ${formatCurrency(flexible.reductionAmount)} dari budget.`
        : "Belum ada kategori fleksibel yang bisa dikurangi.",
    },
    {
      icon: <CalendarDays className="h-5 w-5" aria-hidden="true" />,
      title: "Batas harian",
      description: `Sisihkan ${formatCurrency(plan.dailyRecoveryTarget)} per hari.`,
    },
    {
      icon: <PiggyBank className="h-5 w-5" aria-hidden="true" />,
      title: "Tinjau tabungan",
      description: plan.savingsGoal
        ? `Tunda ${formatCurrency(plan.savingsGoal.suggestedAmount)} ke ${plan.savingsGoal.name}.`
        : "Tinjau setoran sukarela bulan ini.",
    },
  ];

  const moveRecommendation = (direction: -1 | 1) => {
    setActiveRecommendation((current) =>
      (current + direction + recommendations.length) % recommendations.length,
    );
  };

  const dismiss = () => {
    window.localStorage.setItem(dismissalKey, "true");
    setDismissed(true);
  };

  const applyAdjustment = async () => {
    setIsApplying(true);
    setError("");
    try {
      const result = await applyDeficitBudgetAdjustment(plan.currentMonth, plan.currentYear);
      if (!result.success) {
        setError(result.error || "Penyesuaian budget gagal diterapkan.");
        return;
      }

      setConfirmOpen(false);
      router.refresh();
    } catch {
      setError("Penyesuaian budget gagal diterapkan. Coba lagi.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <section
        aria-labelledby="deficit-recovery-title"
        className="relative w-full rounded-[28px] border border-black/[0.03] bg-white p-5 shadow-xs dark:border-white/[0.06] dark:bg-[#1C1E23] sm:rounded-[32px] sm:p-6"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <TactileIconBadge size="md" variant="peach" className="h-11 w-11 sm:h-12 sm:w-12">
            <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </TactileIconBadge>
          <div className="min-w-0 flex-1">
            <h2 id="deficit-recovery-title" className="text-base font-black tracking-tight text-[#18181B] dark:text-white sm:text-lg">
              Rencana pemulihan
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Sembunyikan rekomendasi defisit bulan ini"
            className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-black/[0.04] hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85024] active:scale-95 dark:text-stone-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-extrabold text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 sm:text-xs">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />
            <span>{periodLabel}: defisit {formatCurrency(plan.deficitAmount)}</span>
          </span>
          <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-300 sm:text-sm">
            Tiga langkah untuk pulihkan arus kas.
          </p>
        </div>

        {prefersReducedMotion ? (
          <div className="mt-5 flex flex-col gap-2.5 sm:mt-6">
            {recommendations.map((recommendation, index) => (
              <article key={recommendation.title} className="flex items-start gap-3 rounded-2xl border border-black/[0.03] bg-[#FAF9F6] p-3 dark:border-white/[0.06] dark:bg-[#252830] sm:p-4">
                <TactileIconBadge size="sm" variant="peach" shape="squircle" className="rounded-xl">
                  {recommendation.icon}
                </TactileIconBadge>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400">Strategi {index + 1}</p>
                  <h3 className="mt-0.5 text-sm font-extrabold leading-snug text-[#18181B] dark:text-white">{recommendation.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-300">{recommendation.description}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 sm:mt-6">
            <div className="relative h-[152px] overflow-hidden px-1 pt-1 sm:h-[144px]" aria-live="polite">
              {recommendations.map((recommendation, index) => {
                const rawDistance = (index - activeRecommendation + recommendations.length) % recommendations.length;
                const distance = rawDistance > recommendations.length / 2
                  ? rawDistance - recommendations.length
                  : rawDistance;
                const depth = Math.abs(distance);

                return (
                  <motion.article
                    key={recommendation.title}
                    aria-hidden={distance !== 0}
                    initial={false}
                    animate={{
                      x: distance * 12,
                      y: depth * 8,
                      rotate: distance * 3,
                      scale: 1 - depth * 0.035,
                      opacity: depth === 0 ? 1 : 0.66,
                    }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ zIndex: recommendations.length - depth }}
                    className="absolute inset-x-1 top-1 grid min-h-[124px] grid-cols-[40px_minmax(0,1fr)] content-start gap-x-3 gap-y-2 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(9,9,11,0.04)] dark:border-white/[0.08] dark:bg-[#252830] sm:min-h-[120px] sm:p-4"
                  >
                    {depth === 0 ? (
                      <>
                        <TactileIconBadge size="md" variant="peach">
                          {recommendation.icon}
                        </TactileIconBadge>
                        <div className="min-w-0 self-center">
                          <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400">Strategi {index + 1} dari {recommendations.length}</p>
                          <h3 className="mt-1 text-sm font-extrabold leading-snug text-[#18181B] dark:text-white sm:text-base">{recommendation.title}</h3>
                        </div>
                        <p className="col-span-2 text-xs leading-relaxed text-stone-600 dark:text-stone-300 sm:text-sm">{recommendation.description}</p>
                      </>
                    ) : (
                      <TactileIconBadge size="md" variant="peach">
                        {recommendation.icon}
                      </TactileIconBadge>
                    )}
                  </motion.article>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                {activeRecommendation + 1} / {recommendations.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveRecommendation(-1)}
                  aria-label="Lihat strategi sebelumnya"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.06] bg-white text-stone-700 transition-colors hover:bg-[#F7F4EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85024] dark:border-white/[0.08] dark:bg-[#252830] dark:text-stone-200 dark:hover:bg-[#2B2E35]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveRecommendation(1)}
                  aria-label="Lihat strategi berikutnya"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.06] bg-white text-stone-700 transition-colors hover:bg-[#F7F4EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85024] dark:border-white/[0.08] dark:bg-[#252830] dark:text-stone-200 dark:hover:bg-[#2B2E35]"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-stone-600 dark:text-stone-300">
            <div className="min-w-0">
              <span className="block font-extrabold text-[#18181B] dark:text-white">Pemulihan bulan ini</span>
              <span className="mt-0.5 block font-medium text-stone-500 dark:text-stone-400">
                {formatCurrency(plan.recoveredAmount)} dari {formatCurrency(plan.deficitAmount)}
              </span>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold tabular-nums text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              {plan.recoveryPercent}%
            </span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-rose-100 dark:bg-rose-950/70"
            role="progressbar"
            aria-label="Progres pemulihan defisit"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={plan.recoveryPercent}
          >
            <div
              className="h-full rounded-full bg-[#E85024] transition-[width] duration-500"
              style={{ width: `${plan.recoveryPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!flexible}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#E85024] px-5 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#d44319] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85024] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Terapkan penyesuaian budget <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          hideClose
          showHandle
          className="p-0 overflow-hidden flex flex-col max-h-[90svh] sm:max-h-[86vh] h-auto rounded-t-[36px] sm:rounded-[36px] bg-white dark:bg-slate-900 border border-black/[0.04] dark:border-slate-800 shadow-2xl max-w-lg w-full"
        >
          <DialogHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <TactileIconBadge size="md" variant="peach" className="h-11 w-11">
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                </TactileIconBadge>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-black tracking-tight text-[#18181B] dark:text-white sm:text-lg">
                    Terapkan penyesuaian?
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-stone-500 dark:text-slate-400">
                    Limit budget {flexible?.label ?? "kategori"} akan dikurangi.
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isApplying}
                aria-label="Tutup dialog"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100/90 text-stone-600 transition-colors hover:bg-stone-200 hover:text-stone-900 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </DialogHeader>

          <div className="px-5 py-3 sm:px-6">
            <div className="rounded-2xl border border-black/[0.04] bg-[#FAF9F6] p-4 dark:border-white/[0.06] dark:bg-[#252830]">
              <p className="text-xs font-bold text-stone-500 dark:text-stone-400">{flexible?.label ?? "Kategori"}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Limit saat ini</p>
                  <p className="truncate text-sm font-bold tabular-nums text-[#18181B] dark:text-white">
                    {flexible ? formatCurrency(flexible.currentLimit) : "—"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
                <div className="min-w-0 text-right">
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Limit baru</p>
                  <p className="truncate text-sm font-black tabular-nums text-[#E85024]">
                    {flexible ? formatCurrency(flexible.proposedLimit) : "—"}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              Hanya limit budget yang berubah; transaksi dan saldo tetap.
            </p>
            {error && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}
          </div>

          <DialogFooter className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={isApplying}
              className="min-h-11 rounded-full border border-black/[0.06] bg-white px-5 text-sm font-bold text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-60 dark:border-white/[0.08] dark:bg-[#252830] dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={applyAdjustment}
              disabled={isApplying || !flexible}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#E85024] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#d44319] disabled:opacity-60"
            >
              {isApplying ? "Menerapkan…" : <><Check className="h-4 w-4" /> Terapkan limit</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

