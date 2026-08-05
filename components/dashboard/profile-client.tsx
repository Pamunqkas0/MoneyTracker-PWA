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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 lg:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-[var(--card-border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-screen-xl px-4 py-3.5 sm:px-6 lg:px-8 flex items-center gap-2.5">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[var(--foreground)] sm:text-lg truncate">
              Setelan Akun
            </h1>
            <p className="text-[11px] text-[var(--muted-foreground)] truncate hidden xs:block">
              Lihat status aplikasi, diagnostik database, dan preferensi lokal
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 py-4 sm:px-6 lg:px-8 space-y-4">
        {/* Profile Card */}
        <Card className="overflow-hidden relative shadow-sm border-[var(--card-border)]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <CardContent className="p-4 sm:p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg sm:text-xl font-bold text-white shadow-sm">
              P
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold text-[var(--foreground)] truncate">
                {user.name}
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--muted-foreground)] truncate mt-0.5 opacity-90">
                {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <Badge variant="outline" className="text-[9px] sm:text-[10px] py-0.5 px-2 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 font-semibold">
                  Auth Aktif
                </Badge>
                <Badge variant="outline" className="text-[9px] sm:text-[10px] py-0.5 px-2 border-blue-500/20 text-blue-700 dark:text-blue-400 bg-blue-500/5 font-semibold">
                  Pro Version
                </Badge>
              </div>
            </div>
            <form action={signOutAction}>
              <Button variant="outline" size="sm" type="submit" className="shrink-0">
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats Grid (Lebih padat & presisi di mobile) */}
        <div className="grid grid-cols-3 gap-2.5">
          <Card className="p-3 text-center border-[var(--card-border)]/60 shadow-sm/5">
            <span className="text-[10px] sm:text-xs font-semibold text-[var(--muted-foreground)] block truncate">Rekening</span>
            <p className="text-base sm:text-xl font-bold text-[var(--foreground)] mt-1 tabular-nums">{stats.bankAccounts}</p>
          </Card>
          <Card className="p-3 text-center border-[var(--card-border)]/60 shadow-sm/5">
            <span className="text-[10px] sm:text-xs font-semibold text-[var(--muted-foreground)] block truncate">Transaksi</span>
            <p className="text-base sm:text-xl font-bold text-[var(--foreground)] mt-1 tabular-nums">{stats.transactions}</p>
          </Card>
          <Card className="p-3 text-center border-[var(--card-border)]/60 shadow-sm/5">
            <span className="text-[10px] sm:text-xs font-semibold text-[var(--muted-foreground)] block truncate">Anggaran</span>
            <p className="text-base sm:text-xl font-bold text-[var(--foreground)] mt-1 tabular-nums">{stats.budgets}</p>
          </Card>
        </div>

        <CategorySettingsCard categories={categories} />

        <TelegramSettingsCard />

        <AppLockSettingsCard />
        <PasskeySettingsCard />
        <ThemeSettingsCard />

        {/* Supabase Diagnostic */}
        <Card className="shadow-sm border-[var(--card-border)]">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">Diagnostik Database</CardTitle>
                <CardDescription className="text-[11px] sm:text-xs mt-0.5">
                  Status koneksi ter-enkripsi ke database Supabase Anda
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-3.5">
            <div className="flex items-center justify-between rounded-xl bg-[var(--muted)]/40 p-3 border border-[var(--card-border)]/30">
              <span className="text-xs font-semibold text-[var(--foreground)]">Status Supabase</span>
              <Badge
                className={cn(
                  "text-[9px] sm:text-[10px] uppercase font-bold border-none px-2 py-0.5 shadow-none",
                  dbStatus === "checking" && "bg-slate-500/10 text-slate-500",
                  dbStatus === "connected" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  dbStatus === "failed" && "bg-rose-500/10 text-rose-500"
                )}
              >
                {dbStatus === "checking" ? "Mengecek..." : dbStatus === "connected" ? "Terhubung" : "Gagal"}
              </Badge>
            </div>

            <Button
              onClick={testDb}
              disabled={testingConnection}
              variant="outline"
              className="w-full text-xs h-10 rounded-xl cursor-pointer font-semibold shadow-sm"
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
          </CardContent>
        </Card>

        {/* PWA & Cache Management */}
        <Card className="shadow-sm border-[var(--card-border)]">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">Sistem PWA & Offline</CardTitle>
                <CardDescription className="text-[11px] sm:text-xs mt-0.5">
                  Kelola penyimpanan offline aplikasi pada perangkat ini
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
            {/* Online Status */}
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--card-border)]/20">
              <span className="text-[var(--muted-foreground)] font-medium">Koneksi Internet</span>
              <span className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs">
                {isOnline ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-rose-500" />
                    <span className="text-rose-500">Offline Mode</span>
                  </>
                )}
              </span>
            </div>

            {/* Offline Support */}
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--card-border)]/20">
              <span className="text-[var(--muted-foreground)] font-medium">Dukungan Offline</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs">
                Aktif (Serwist PWA)
              </span>
            </div>

            {/* Cache Actions */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--foreground)]">Hapus Penyimpanan Cache</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 font-medium leading-normal">
                  Membersihkan data offline lama pada browser
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handleClearCache}
                disabled={cacheCleared}
                className={cn(
                  "shrink-0 h-9 px-3 text-xs font-semibold rounded-xl cursor-pointer transition-colors border border-transparent",
                  cacheCleared
                    ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/10 border-emerald-500/20"
                    : "text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 bg-rose-500/5 sm:bg-transparent"
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
                    <span>Hapus</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferensi Lokal */}
        <Card className="shadow-sm border-[var(--card-border)]">
          <CardHeader className="p-4 sm:p-6 pb-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">Preferensi Lokal</CardTitle>
                <CardDescription className="text-[11px] sm:text-xs mt-0.5">
                  Pengaturan regional dasar aplikasi
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 px-4 sm:px-6 divide-y divide-[var(--card-border)]/30 pb-2">
            <div className="flex items-center justify-between py-3 text-xs font-medium">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <DollarSign className="h-4 w-4 shrink-0" />
                <span>Mata Uang</span>
              </div>
              <span className="text-[var(--foreground)] font-semibold">Rupiah (IDR)</span>
            </div>
            <div className="flex items-center justify-between py-3 text-xs font-medium">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <Globe className="h-4 w-4 shrink-0" />
                <span>Bahasa</span>
              </div>
              <span className="text-[var(--foreground)] font-semibold">Bahasa Indonesia</span>
            </div>
            <div className="flex items-center justify-between py-3 text-xs font-medium">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <Info className="h-4 w-4 shrink-0" />
                <span>Versi PWA</span>
              </div>
              <span className="text-[var(--foreground)] font-semibold tabular-nums">v1.2.0 (Stable)</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
