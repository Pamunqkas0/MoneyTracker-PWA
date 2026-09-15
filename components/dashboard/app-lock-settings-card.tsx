"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppLockSettingsCard() {
  const [hasPin, setHasPin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pin, setPin] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedPin = localStorage.getItem("mt_app_pin");
    if (savedPin) {
      setHasPin(true);
    }
    setMounted(true);
  }, []);

  const handleSavePin = () => {
    if (pin.length === 4) {
      localStorage.setItem("mt_app_pin", pin);
      setHasPin(true);
      setIsEditing(false);
      setPin("");
    }
  };

  const handleRemovePin = () => {
    localStorage.removeItem("mt_app_pin");
    setHasPin(false);
  };

  if (!mounted) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-black/[0.03] dark:border-slate-800 shadow-xs flex flex-col gap-4 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-[#FDD5C1] dark:bg-orange-950/60 flex items-center justify-center text-[#E85024] shadow-2xs shrink-0">
          <Lock className="h-5 w-5 stroke-[2.2]" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#18181B] dark:text-slate-100">Kunci Aplikasi (PIN)</h3>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
            Gunakan PIN 4 digit untuk mengamankan akses ke aplikasi
          </p>
        </div>
      </div>

      <div className="pt-1">
        {hasPin && !isEditing ? (
          <div className="flex items-center justify-between rounded-2xl bg-surface-muted/50 dark:bg-slate-800/80 p-3.5 border border-black/[0.02] dark:border-white/[0.04]">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Lock className="h-4 w-4" />
              <span className="text-xs font-bold">PIN 4-Digit Aktif</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-bold px-3.5 rounded-full border-stone-200 dark:border-slate-700 cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                Ubah PIN
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 text-xs font-bold px-3.5 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60 shadow-none cursor-pointer"
                onClick={handleRemovePin}
              >
                Hapus
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {!isEditing && !hasPin && (
              <div className="flex items-center justify-between rounded-2xl bg-surface-muted/50 dark:bg-slate-800/80 p-3.5 border border-black/[0.02] dark:border-white/[0.04]">
                <div className="flex items-center gap-2 text-stone-500 dark:text-slate-400">
                  <Unlock className="h-4 w-4" />
                  <span className="text-xs font-semibold">PIN Nonaktif</span>
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs font-bold px-4 rounded-full bg-[#E85024] hover:bg-[#d44319] text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                  onClick={() => setIsEditing(true)}
                >
                  Aktifkan PIN
                </Button>
              </div>
            )}

            {isEditing && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Masukkan 4 Digit PIN Baru"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                    className="pl-10 h-11 text-xs font-bold rounded-2xl bg-surface-muted/60 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-[#18181B] dark:text-slate-100 tracking-widest"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-initial h-11 px-5 rounded-full bg-[#E85024] hover:bg-[#d44319] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    onClick={handleSavePin}
                    disabled={pin.length !== 4}
                  >
                    Simpan PIN
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-initial h-11 px-4 rounded-full text-xs font-bold cursor-pointer border-stone-200 dark:border-slate-700"
                    onClick={() => {
                      setIsEditing(false);
                      setPin("");
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
