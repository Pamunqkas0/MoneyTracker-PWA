"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  SlidersHorizontal as FilterIcon,
  Plus as PlusIcon,
  ArrowUpRight as ArrowUpRightIcon,
} from "lucide-react";
import type { FinancialSummary, MonthlyData } from "@/lib/types";

interface RightColumnBentoProps {
  summary: FinancialSummary;
  monthlyData: MonthlyData[];
}

export function RightColumnBento({
  summary,
  monthlyData = [],
}: RightColumnBentoProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string>("bitcoin");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1h");

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalSpent = summary?.totalExpenses ?? 2450;
  const budget = 3000;
  const netSavings = summary?.totalSavings && summary.totalSavings > 0 ? summary.totalSavings : 550;

  // Asset Ticker List
  const cryptoAssets = [
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      price: "$ 124 131.89",
      gain: "+12,3%",
      iconBg: "bg-[#F7931A]",
      textColor: "text-[#F7931A]",
      icon: (
        <span className="font-bold text-xs text-white">₿</span>
      ),
    },
    {
      id: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      price: "$ 3,420.50",
      gain: "+8.4%",
      iconBg: "bg-[#627EEA]",
      textColor: "text-[#627EEA]",
      icon: (
        <span className="font-bold text-xs text-white">Ξ</span>
      ),
    },
    {
      id: "tether",
      name: "Tether",
      symbol: "USDT",
      price: "$ 1.00",
      gain: "+0.1%",
      iconBg: "bg-[#26A17B]",
      textColor: "text-[#26A17B]",
      icon: (
        <span className="font-bold text-xs text-white">₮</span>
      ),
    },
    {
      id: "bnb",
      name: "BNB",
      symbol: "BNB",
      price: "$ 590.25",
      gain: "+4.2%",
      iconBg: "bg-[#F3BA2F]",
      textColor: "text-[#F3BA2F]",
      icon: (
        <span className="font-bold text-xs text-white">◇</span>
      ),
    },
    {
      id: "cardano",
      name: "Cardano",
      symbol: "ADA",
      price: "$ 0.48",
      gain: "+2.9%",
      iconBg: "bg-[#0033AD]",
      textColor: "text-[#0033AD]",
      icon: (
        <span className="font-bold text-xs text-white">₳</span>
      ),
    },
  ];

  const currentAsset = cryptoAssets.find((a) => a.id === selectedAsset) || cryptoAssets[0];

  // Timeframe pills
  const timeframes = ["1h", "24h", "Week", "Month", "6 Month"];

  // Default Chart Data Points for the warm coral wave line
  const defaultChartData = [
    { day: "1", val: 82000 },
    { day: "4", val: 89000 },
    { day: "7", val: 84000 },
    { day: "10", val: 96000 },
    { day: "14", val: 91000 },
    { day: "18", val: 104000 },
    { day: "21", val: 98000 },
    { day: "25", val: 116000 },
    { day: "28", val: 108000 },
    { day: "31", val: 124131 },
  ];

  const chartData =
    monthlyData && monthlyData.length > 0
      ? monthlyData.map((m, idx) => ({
          day: m.month ? m.month.slice(0, 3) : String(idx + 1),
          val: m.income || m.expense || 50000 + idx * 6000,
        }))
      : defaultChartData;

  return (
    <div className="w-full rounded-[32px] bg-white border border-black/[0.03] shadow-xs p-5 md:p-6 flex flex-col justify-between gap-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      {/* ═════════ 1. HEADER & CRYPTO ASSET TICKER BAR ═════════ */}
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-base md:text-lg font-bold text-[#18181B] tracking-tight">
            Marketing
          </h2>
          <button
            title="Filter pasar"
            className="w-8 h-8 rounded-full bg-surface-muted/60 border border-black/[0.02] flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <FilterIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Asset Ticker Icons (Horizontal Row) */}
        <div className="p-2.5 rounded-2xl bg-surface-muted/40 border border-black/[0.02] flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
          {cryptoAssets.map((asset) => {
            const isSelected = selectedAsset === asset.id;
            return (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id)}
                className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-2xl transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "bg-white shadow-xs scale-105"
                    : "opacity-70 hover:opacity-100 hover:bg-white/50"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full ${asset.iconBg} flex items-center justify-center shadow-2xs`}
                >
                  {asset.icon}
                </div>
                <span className="text-[10px] font-semibold text-stone-600 truncate max-w-[50px]">
                  {asset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════════ 2. MARKET PRICE & TIMEFRAME SWITCHER ═════════ */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-stone-400">Market Price</span>

        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Main Price */}
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight tabular-nums">
              {currentAsset.price}
            </span>

            {/* Gain Badge */}
            <span className="px-2.5 py-0.5 rounded-full bg-[#D8F5A2]/70 text-emerald-800 text-xs font-extrabold flex items-center gap-0.5 shadow-2xs">
              {currentAsset.gain}
            </span>
          </div>

          {/* Plus action button */}
          <button
            title="Tambah watchlist"
            className="w-8 h-8 rounded-full bg-surface-muted/80 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Time Selector Bar */}
        <div className="rounded-full bg-surface-muted/70 p-1 flex items-center justify-between text-xs my-2 border border-black/[0.02]">
          {timeframes.map((tf) => {
            const isActive = selectedTimeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`py-1 px-3 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#1A1A1A] text-white shadow-xs font-bold"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════════ 3. INTERACTIVE CORAL AREA / LINE CHART ═════════ */}
      <div className="flex flex-col gap-1 w-full">
        <div className="h-[140px] sm:h-[150px] w-full select-none">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="savorCoralGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E85024" stopOpacity={0.28} />
                    <stop offset="60%" stopColor="#E85024" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#E85024" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-xl border border-black/[0.06] bg-[#1A1A1A] text-white px-3 py-1.5 text-xs shadow-lg font-mono font-bold">
                        ${Number(payload[0].value).toLocaleString()}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="#E85024"
                  strokeWidth={2.5}
                  fill="url(#savorCoralGradient)"
                  dot={false}
                  activeDot={{ r: 4.5, fill: "#E85024", stroke: "#FFFFFF", strokeWidth: 2 }}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* X-Axis Date Indicators below chart */}
        <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 px-2 pt-1 border-t border-stone-100">
          <span>1</span>
          <span>7</span>
          <span>14</span>
          <span>21</span>
          <span>28</span>
          <span>31</span>
        </div>
      </div>

      {/* ═════════ 4. BUDGET & SPENDING BREAKDOWN (3 Metrik Bawah) ═════════ */}
      <div className="grid grid-cols-3 gap-2 items-center pt-2 border-t border-stone-100">
        <div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight block">
            Total Spent
          </span>
          <span className="text-sm sm:text-base font-black text-stone-900 tabular-nums">
            ${totalSpent.toLocaleString("en-US")}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight block">
            Budget
          </span>
          <span className="text-sm sm:text-base font-black text-stone-900 tabular-nums">
            ${budget.toLocaleString("en-US")}
          </span>
        </div>

        <div className="flex justify-end">
          <div className="px-3 py-1.5 rounded-full bg-[#5CB85C] text-white font-black text-xs flex items-center gap-1 shadow-xs tracking-tight">
            <ArrowUpRightIcon className="w-3.5 h-3.5 stroke-[3]" />
            <span>${netSavings.toLocaleString("en-US")}</span>
          </div>
        </div>
      </div>

      {/* ═════════ 5. TEAM MEMBERS / SHARED ACCOUNTS SECTION ═════════ */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-bold text-stone-800 tracking-tight">Team Members</h3>
          <button className="text-[11px] font-bold text-brand-orange hover:underline cursor-pointer">
            See all
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-surface-muted/40 border border-black/[0.03] flex items-center justify-between gap-2 shadow-2xs">
          {/* Stacked Avatars & Text */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex -space-x-2 overflow-hidden shrink-0">
              <div className="w-7 h-7 rounded-full bg-[#FAD170] border-2 border-white flex items-center justify-center text-xs font-bold shadow-xs">
                🧔
              </div>
              <div className="w-7 h-7 rounded-full bg-[#D8F5A2] border-2 border-white flex items-center justify-center text-xs font-bold shadow-xs">
                👩
              </div>
              <div className="w-7 h-7 rounded-full bg-[#FDD5C1] border-2 border-white flex items-center justify-center text-xs font-bold shadow-xs">
                👨
              </div>
            </div>
            <span className="text-xs font-semibold text-stone-700 truncate">
              You & 2 members
            </span>
          </div>

          {/* Add member button */}
          <button
            title="Tambah anggota tim"
            className="w-7 h-7 rounded-full bg-[#E85024] hover:bg-[#d44319] text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <PlusIcon className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
}
