"use client";

import { useEffect, useState } from "react";
import { Fingerprint, KeyRound, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PasskeyListItem {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
}

function formatDateTime(value?: string) {
  if (!value) return "Belum pernah dipakai";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PasskeySettingsCard() {
  const isSupported =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== "undefined";
  const [loading, setLoading] = useState(isSupported);
  const [registering, setRegistering] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyListItem[]>([]);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const loadPasskeys = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.passkey.list();

    if (error) {
      setMessage({ type: "error", text: error.message });
      setPasskeys([]);
    } else {
      setPasskeys(data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!isSupported) return;

    const timer = window.setTimeout(() => {
      void loadPasskeys();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isSupported]);

  const handleRegisterPasskey = async () => {
    setRegistering(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.registerPasskey();

    if (error) {
      setMessage({ type: "error", text: error.message });
      setRegistering(false);
      return;
    }

    setMessage({
      type: "success",
      text: "Face ID / passkey berhasil diaktifkan untuk akun ini.",
    });
    setRegistering(false);
    await loadPasskeys();
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    setRemovingId(passkeyId);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.passkey.delete({ passkeyId });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setRemovingId(null);
      return;
    }

    setMessage({
      type: "success",
      text: "Passkey berhasil dihapus. Login password tetap bisa dipakai.",
    });
    setRemovingId(null);
    await loadPasskeys();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-black/[0.03] dark:border-slate-800 shadow-xs flex flex-col gap-4 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-[#D8F5A2] dark:bg-emerald-950/60 flex items-center justify-center text-emerald-900 dark:text-emerald-300 shadow-2xs shrink-0">
          <Fingerprint className="h-5 w-5 stroke-[2.2]" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#18181B] dark:text-slate-100">Face ID / Passkey</h3>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
            Jadikan Face ID sebagai opsi login utama tanpa menghapus login password
          </p>
        </div>
      </div>

      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between rounded-2xl bg-surface-muted/50 dark:bg-slate-800/80 p-3.5 border border-black/[0.02] dark:border-white/[0.04]">
          <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">Status perangkat</span>
          <span
            className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
              isSupported
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
            )}
          >
            {isSupported ? "Siap digunakan" : "Belum didukung"}
          </span>
        </div>

        {!isSupported && (
          <p className="text-xs text-stone-400 dark:text-slate-400">
            Passkey butuh browser yang mendukung WebAuthn dan koneksi aman HTTPS atau localhost.
          </p>
        )}

        {message && (
          <div
            className={cn(
              "rounded-2xl border px-3.5 py-2.5 text-xs font-medium",
              message.type === "success"
                ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300"
                : "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
            )}
          >
            {message.text}
          </div>
        )}

        <Button
          type="button"
          onClick={handleRegisterPasskey}
          disabled={!isSupported || registering}
          className="w-full h-11 rounded-full bg-[#1A1A1A] hover:bg-stone-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          {registering ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              <span>Mendaftarkan Face ID...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              <span>Aktifkan Face ID / Passkey Baru</span>
            </>
          )}
        </Button>

        <div className="space-y-2 pt-2 border-t border-black/[0.03] dark:border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#18181B] dark:text-slate-100">Passkey Terdaftar</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300">
              {loading ? "..." : `${passkeys.length} aktif`}
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-black/[0.03] dark:border-slate-800 bg-surface-muted/30 dark:bg-slate-800/40 p-3.5 text-xs text-stone-400 dark:text-slate-500 text-center">
              Memuat daftar passkey...
            </div>
          ) : passkeys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 dark:border-slate-800 p-4 text-xs text-stone-400 dark:text-slate-500 text-center">
              Belum ada passkey. Password tetap menjadi opsi login utama Anda.
            </div>
          ) : (
            <div className="space-y-2">
              {passkeys.map((passkey, index) => (
                <div
                  key={passkey.id}
                  className="flex items-center gap-3 rounded-2xl border border-black/[0.03] dark:border-white/[0.04] bg-surface-muted/40 dark:bg-slate-800/60 p-3 hover:bg-surface-muted/60 dark:hover:bg-slate-800 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 shadow-2xs flex items-center justify-center text-stone-800 dark:text-slate-100 shrink-0">
                    <KeyRound className="h-4 w-4 text-[#E85024]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#18181B] dark:text-slate-100">
                      {passkey.friendly_name || `Face ID ${index + 1}`}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-slate-400 mt-0.5">
                      Dibuat {formatDateTime(passkey.created_at)} &bull; Terakhir {formatDateTime(passkey.last_used_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={removingId === passkey.id}
                    onClick={() => void handleDeletePasskey(passkey.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer shrink-0"
                    title="Hapus Passkey"
                  >
                    {removingId === passkey.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
