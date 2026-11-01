"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, PiggyBank, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getTrendBg } from "@/lib/utils";
import type { FinancialSummary } from "@/lib/types";
import { usePrivacy } from "@/hooks/use-privacy";

interface SummaryCardProps {
  title: string;
  value: number;
  growth: number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor: string;
  action?: React.ReactNode;
  hidden?: boolean;
  delay?: number;
}

function SummaryCard({ title, value, growth, subtitle, icon, accentColor, action, hidden = false, delay = 0 }: SummaryCardProps) {
  const isPositive = growth >= 0;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, delay }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card 
        className="relative overflow-hidden group h-full border-0 transition-all duration-300 text-white"
        style={{ 
          background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 80%, #1e1e2f), color-mix(in srgb, ${accentColor} 40%, #0b0b12))`
        }}
      >
        {/* Decorative background elements for credit card look */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 rounded-full blur-xl -ml-5 -mb-5 pointer-events-none" />

        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full relative z-10 min-h-[150px] sm:min-h-[170px]">
          {/* Top row: Title and Icon/Action */}
          <div className="flex items-start justify-between w-full mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-widest drop-shadow-sm">
                {title}
              </span>
              {/* Fake credit card chip */}
              <div className="mt-2.5 w-8 h-6 sm:w-10 sm:h-7 bg-yellow-500/30 rounded sm:rounded-md border border-yellow-300/40 flex items-center justify-center overflow-hidden relative shadow-sm">
                 <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 to-transparent"></div>
                 <div className="w-full h-px bg-yellow-300/30 absolute top-1/2"></div>
                 <div className="h-full w-px bg-yellow-300/30 absolute left-[30%]"></div>
                 <div className="h-full w-px bg-yellow-300/30 absolute right-[30%]"></div>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              {action && (
                <div className="text-white/80 hover:text-white transition-colors">
                  {action}
                </div>
              )}
              <div className="p-1.5 sm:p-2 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-sm">
                <div className="h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center [&>svg]:h-full [&>svg]:w-full">
                  {icon}
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Value / Balance (Card Number style) */}
          <div className="mt-auto mb-3 sm:mb-4">
             <h3 className="text-lg sm:text-2xl lg:text-[1.7rem] font-bold text-white tracking-wide font-mono drop-shadow-md break-words leading-tight">
               {hidden ? "•••• •••• ••••" : isMounted ? formatCurrency(value) : "Rp0"}
             </h3>
          </div>

          {/* Bottom row: Subtitle and Badge */}
          <div className="flex items-end justify-between w-full">
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Valid Thru</span>
              <span className="text-[10px] sm:text-[11px] text-white/90 font-medium tracking-wide truncate max-w-[100px] sm:max-w-[140px] uppercase">
                {subtitle || "LIFETIME"}
              </span>
            </div>
            
            <div className="flex items-center">
              <Badge
                variant="outline"
                className={`px-1.5 py-0.5 border-white/20 bg-black/20 text-white shadow-none font-semibold w-fit shrink-0 backdrop-blur-md`}
              >
                <span className="flex items-center gap-0.5 text-[10px] sm:text-xs">
                  {isPositive ? <ArrowUpRight className="h-3 w-3 text-emerald-400" /> : <ArrowDownRight className="h-3 w-3 text-rose-400" />}
                  {Math.abs(growth)}%
                </span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function FinancialOverview({ summary }: { summary: FinancialSummary }) {
  const { hidden, toggleHidden } = usePrivacy();

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <SummaryCard
          title="Total Saldo"
          value={summary.totalBalance}
          growth={summary.balanceGrowth}
          subtitle="vs. bulan lalu"
          icon={<Wallet />}
          accentColor="#10b981"
          action={(
            <button
              onClick={toggleHidden}
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-white/20 bg-black/20 text-white/80 transition-colors hover:bg-black/40 hover:text-white backdrop-blur-md"
              aria-label={hidden ? "Tampilkan saldo ringkasan" : "Sembunyikan saldo ringkasan"}
            >
              {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          )}
          hidden={hidden}
          delay={0}
        />
        <SummaryCard
          title="Pemasukan"
          value={summary.totalIncome}
          growth={summary.incomeGrowth}
          subtitle="bulan ini"
          icon={<TrendingUp />}
          accentColor="#6366f1"
          hidden={hidden}
          delay={0.04}
        />
        <SummaryCard
          title="Pengeluaran"
          value={summary.totalExpenses}
          growth={summary.expenseGrowth}
          subtitle="bulan ini"
          icon={<TrendingDown />}
          accentColor="#f43f5e"
          hidden={hidden}
          delay={0.08}
        />
        <SummaryCard
          title="Total Tabungan"
          value={summary.totalSavings}
          growth={summary.savingsRate}
          subtitle={`Rasio: ${summary.savingsRate}%`}
          icon={<PiggyBank />}
          accentColor="#f59e0b"
          hidden={hidden}
          delay={0.12}
        />
    </div>
  );
}
