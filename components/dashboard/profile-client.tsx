"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Shield,
  Smartphone,
  Database,
  Wifi,
  WifiOff,
  Trash2,
  CheckCircle2,
  Info,
  DollarSign,
  Globe,
  Loader2,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/auth/actions";
import { PasskeySettingsCard } from "@/components/auth/passkey-settings-card";
import { CategorySettingsCard } from "@/components/dashboard/category-settings-card";
import { ThemeSettingsCard } from "@/components/dashboard/theme-settings-card";
import { AppLockSettingsCard } from "@/components/dashboard/app-lock-settings-card";
import { TelegramSettingsCard } from "@/components/dashboard/telegram-settings-card";
import type { CategoryRow } from "@/lib/supabase/types";

interface ProfileClientProps {
  stats: {
    transactions: number;
    bankAccounts: number;
    budgets: number;
  };
  user: {
    name: string;
    email: string;
  };
  categories: CategoryRow[];
}

export function ProfileClient({ stats, user, categories }: ProfileClientProps) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "failed">("checking");
  const [testingConnection, setTestingConnection] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const testDb = useCallback(async () => {
    setTestingConnection(true);
    setDbStatus("checking");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("bank_accounts").select("id").limit(1);
      if (error) throw error;
      setDbStatus("connected");
    } catch (err) {
      console.error("DB Test failed", err);
      setDbStatus("failed");
    } finally {
      setTestingConnection(false);
    }
  }, []);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    const checkConnection = window.setTimeout(() => {
      void testDb();
    }, 0);

    return () => {
      window.clearTimeout(checkConnection);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [testDb]);

  const handleClearCache = async () => {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
    }
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  const initialLetter = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F4EE] dark:bg-[#0b0f1a] text-[#18181B] dark:text-[#f1f5f9] px-3 pb-3 pt-0 sm:p-5 md:p-6 lg:p-8 flex justify-center items-start selection:bg-brand-orange/20 transition-colors">
      {/* ── Main Canvas Shell ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-7xl rounded-[28px] sm:rounded-[32px] md:rounded-[36px] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm border border-black/[0.04] dark:border-slate-800 p-4 sm:p-6 md:p-8 lg:p-10 shadow-xs flex flex-col gap-6 transition-colors"
      >
        {/* ════════════════════════════════════════════════════════════════
            1. TOP HEADER BAR (Back | Title & Subtitle | Sign Out)
        ════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-black/[0.04] dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-black/[0.04] dark:border-slate-700 shadow-xs flex items-center justify-center text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer shrink-0"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="h-4 w-4 stroke-[2.2]" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#18181B] dark:text-slate-100 truncate">
                Pengaturan & Profil
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 font-medium truncate mt-0.5">
                Kelola keamanan, preferensi sistem, dan kustomisasi akun Anda
              </p>
            </div>
          </div>

          <form action={signOutAction}>
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold px-4 py-2 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-rose-200/50 dark:border-rose-900/50 shadow-2xs shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </Button>
          </form>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            2. BENTO GRID 2-KOLOM (Kiri: Profil & Sistem | Kanan: Pengaturan)
        ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ────── SISI KIRI (lg:col-span-4): Profile Hero & Diagnostics ────── */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Hero Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-black/[0.03] dark:border-slate-800 shadow-xs flex flex-col items-center text-center relative overflow-hidden transition-colors">
              <div className="w-20 h-20 rounded-full ring-4 ring-[#D8F5A2] dark:ring-emerald-500/40 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-2xl font-black text-[#18181B] dark:text-slate-100 shadow-sm mb-3">
                {initialLetter}
              </div>

              <h2 className="text-lg font-bold text-[#18181B] dark:text-slate-100 truncate max-w-full">
                {user.name}
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400 truncate max-w-full mt-0.5 mb-4">
                {user.email}
              </p>

              <div className="flex items-center gap-1.5 mb-5">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 uppercase tracking-wider">
                  Auth Aktif
                </span>
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 uppercase tracking-wider">
                  Pro Version
                </span>
              </div>

              {/* 3 Stat Pills */}
              <div className="grid grid-cols-3 gap-2 w-full pt-1 border-t border-black/[0.03] dark:border-slate-800">
                <div className="bg-surface-muted/60 dark:bg-slate-800/80 rounded-2xl p-2.5 text-center flex flex-col justify-center">
                  <span className="text-base sm:text-lg font-black text-[#18181B] dark:text-slate-100 tabular-nums">
                    {stats.bankAccounts}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-400 dark:text-slate-400 truncate mt-0.5">
                    Rekening
                  </span>
                </div>
                <div className="bg-surface-muted/60 dark:bg-slate-800/80 rounded-2xl p-2.5 text-center flex flex-col justify-center">
                  <span className="text-base sm:text-lg font-black text-[#18181B] dark:text-slate-100 tabular-nums">
                    {stats.transactions}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-400 dark:text-slate-400 truncate mt-0.5">
                    Transaksi
                  </span>
                </div>
                <div className="bg-surface-muted/60 dark:bg-slate-800/80 rounded-2xl p-2.5 text-center flex flex-col justify-center">
                  <span className="text-base sm:text-lg font-black text-[#18181B] dark:text-slate-100 tabular-nums">
                    {stats.budgets}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-400 dark:text-slate-400 truncate mt-0.5">
                    Anggaran
                  </span>
                </div>
              </div>
            </div>

            {/* Supabase Diagnostics Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-black/[0.03] dark:border-slate-800 shadow-xs flex flex-col gap-3.5 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-2xl bg-[#DAEFEA] dark:bg-teal-950/60 flex items-center justify-center text-teal-800 dark:text-teal-300 shadow-2xs shrink-0">
                  <Database className="h-4 w-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-slate-100">Diagnostik Database</h3>
                  <p className="text-[10px] text-stone-400 dark:text-slate-400">Koneksi aman Supabase</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-surface-muted/50 dark:bg-slate-800/80 p-3">
                <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">Status Supabase</span>
                <span
                  className={cn(
                    "text-[10px] uppercase font-bold px-2.5 py-1 rounded-full",
                    dbStatus === "checking" && "bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-slate-300",
                    dbStatus === "connected" && "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300",
                    dbStatus === "failed" && "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                  )}
                >
                  {dbStatus === "checking" ? "Mengecek..." : dbStatus === "connected" ? "Terhubung" : "Gagal"}
                </span>
              </div>

              <Button
                onClick={testDb}
                disabled={testingConnection}
                className="w-full text-xs h-10 rounded-full bg-[#1A1A1A] hover:bg-stone-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Menguji Koneksi...
                  </>
                ) : (
                  "Uji Koneksi Ulang"
                )}
              </Button>
            </div>

            {/* PWA & Cache Management Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-black/[0.03] dark:border-slate-800 shadow-xs flex flex-col gap-3.5 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-2xl bg-[#E0E6FD] dark:bg-blue-950/60 flex items-center justify-center text-blue-900 dark:text-blue-300 shadow-2xs shrink-0">
                  <Smartphone className="h-4 w-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-slate-100">Sistem PWA & Offline</h3>
                  <p className="text-[10px] text-stone-400 dark:text-slate-400">Penyimpanan cache lokal</p>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-black/[0.03] dark:divide-slate-800 text-xs">
                {/* Online Status */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-stone-500 dark:text-slate-400 font-medium">Koneksi Internet</span>
                  <span className="flex items-center gap-1.5 font-bold text-xs">
                    {isOnline ? (
                      <>
                        <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-rose-600 dark:text-rose-400">Offline Mode</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Offline Support */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-stone-500 dark:text-slate-400 font-medium">Dukungan Offline</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                    Aktif (Serwist PWA)
                  </span>
                </div>
              </div>

              {/* Cache Action */}
              <div className="pt-1 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#18181B] dark:text-slate-100">Hapus Cache PWA</p>
                  <p className="text-[10px] text-stone-400 dark:text-slate-400">
                    Bersihkan data offline usang
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleClearCache}
                  disabled={cacheCleared}
                  className={cn(
                    "h-9 px-4 text-xs font-bold rounded-full cursor-pointer transition-all border",
                    cacheCleared
                      ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                      : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border-rose-200/60 dark:border-rose-900/60"
                  )}
                >
                  {cacheCleared ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 shrink-0" />
                      <span>Terhapus</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5 mr-1 shrink-0" />
                      <span>Bersihkan</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Local Preferences */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-black/[0.03] dark:border-slate-800 shadow-xs flex flex-col gap-3 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-2xl bg-[#FAD170] dark:bg-amber-950/60 flex items-center justify-center text-amber-900 dark:text-amber-300 shadow-2xs shrink-0">
                  <Shield className="h-4 w-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-slate-100">Preferensi Lokal</h3>
                  <p className="text-[10px] text-stone-400 dark:text-slate-400">Pengaturan regional dasar</p>
                </div>
              </div>

              <div className="divide-y divide-black/[0.03] dark:divide-slate-800 text-xs">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-stone-500 dark:text-slate-400 font-medium">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Mata Uang</span>
                  </div>
                  <span className="font-bold text-[#18181B] dark:text-slate-100">Rupiah (IDR)</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-stone-500 dark:text-slate-400 font-medium">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Bahasa</span>
                  </div>
                  <span className="font-bold text-[#18181B] dark:text-slate-100">Bahasa Indonesia</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-stone-500 dark:text-slate-400 font-medium">
                    <Info className="h-3.5 w-3.5" />
                    <span>Versi PWA</span>
                  </div>
                  <span className="font-bold text-[#18181B] dark:text-slate-100 tabular-nums">v1.2.0 (Stable)</span>
                </div>
              </div>
            </div>
          </div>

          {/* ────── SISI KANAN (lg:col-span-8): Feature & Security Cards ────── */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <PasskeySettingsCard />
            <AppLockSettingsCard />
            <TelegramSettingsCard />
            <CategorySettingsCard categories={categories} />
            <ThemeSettingsCard />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
