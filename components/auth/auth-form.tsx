"use client";

import { useActionState, useState } from "react";
import { Fingerprint, Loader2, LogIn, PiggyBank, UserPlus } from "lucide-react";
import { signInAction, signUpAction, type AuthFormState } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: AuthFormState = {};

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginAction, loginPending] = useActionState(signInAction, initialState);
  const [registerState, registerAction, registerPending] = useActionState(signUpAction, initialState);
  const [passkeyPending, setPasskeyPending] = useState(false);
  const [passkeyMessage, setPasskeyMessage] = useState<AuthFormState>({});
  const state = mode === "login" ? loginState : registerState;
  const pending = mode === "login" ? loginPending : registerPending;
  const supportsPasskey =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== "undefined";

  const handlePasskeyLogin = async () => {
    setPasskeyPending(true);
    setPasskeyMessage({});

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPasskey();

    if (error) {
      setPasskeyMessage({ error: error.message });
      setPasskeyPending(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <Card className="w-full max-w-md rounded-[32px] border-black/[0.04] bg-white/95 shadow-xl shadow-stone-900/10 dark:border-slate-800 dark:bg-slate-900/95">
      <CardHeader className="space-y-6 p-6 pb-0 sm:p-8 sm:pb-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7A45] to-[#E85024] text-white shadow-md shadow-brand-orange/20">
            <PiggyBank className="h-5 w-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-[#1A1A1A] dark:text-white">
            Sav<span className="text-brand-orange">O</span>r
          </span>
        </div>
        <div>
          <CardTitle className="text-2xl font-black tracking-tight">
            {mode === "login" ? "Hai, balik lagi?" : "Mulai atur uangmu"}
          </CardTitle>
          <CardDescription className="mt-1 text-sm">
            {mode === "login"
              ? "Yuk, cek kondisi keuanganmu."
              : "Bikin akun, lalu catat transaksi pertamamu."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-6 pt-5 sm:p-8 sm:pt-6">
        <div className="grid grid-cols-2 rounded-2xl border border-black/[0.04] bg-surface-muted/70 p-1 dark:border-slate-700 dark:bg-slate-800/70">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-bold transition-all",
              mode === "login"
                ? "bg-white text-[#18181B] shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-bold transition-all",
              mode === "register"
                ? "bg-white text-[#18181B] shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            Daftar
          </button>
        </div>

        <form action={mode === "login" ? loginAction : registerAction} className="space-y-4">
          {mode === "login" && (
            <div className="space-y-3">
              <Button
                type="button"
                className="h-11 w-full rounded-2xl border border-stone-200 bg-surface-muted/60 text-[#18181B] shadow-sm hover:bg-surface-muted dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                disabled={!supportsPasskey || passkeyPending}
                onClick={() => void handlePasskeyLogin()}
              >
                {passkeyPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="h-4 w-4" />
                )}
                Masuk pakai Face ID
              </Button>
              <p className="text-center text-xs leading-relaxed text-stone-500 dark:text-slate-400">
                Belum pakai passkey? Masuk dengan email dan password.
              </p>
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--card-border)]/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-[11px] text-stone-400 dark:bg-slate-900 dark:text-slate-500">
                    atau pakai password
                  </span>
                </div>
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                placeholder="Nama kamu"
                className="rounded-2xl bg-[#FAF8F5] focus:border-brand-orange focus:ring-brand-orange/30 dark:bg-slate-800/70"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              className="rounded-2xl bg-[#FAF8F5] focus:border-brand-orange focus:ring-brand-orange/30 dark:bg-slate-800/70"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="Min. 6 karakter"
              className="rounded-2xl bg-[#FAF8F5] focus:border-brand-orange focus:ring-brand-orange/30 dark:bg-slate-800/70"
            />
          </div>

          {(passkeyMessage.error || state.error) && (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
              {passkeyMessage.error || state.error}
            </p>
          )}
          {(passkeyMessage.success || state.success) && (
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700">
              {passkeyMessage.success || state.success}
            </p>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#FF7A45] to-[#E85024] text-sm font-extrabold text-white shadow-md shadow-brand-orange/20 hover:from-[#f66d3b] hover:to-[#d9431c] focus-visible:ring-brand-orange"
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {mode === "login" ? "Masuk" : "Buat Akun"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
