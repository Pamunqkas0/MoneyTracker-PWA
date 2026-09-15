"use client";

import { useEffect, useState, useCallback } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTelegramStatus, generateTelegramPairingCode, disconnectTelegram } from "@/app/actions";

export function TelegramSettingsCard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<{
    isConnected: boolean;
    telegramChatId: string | null;
    pairingCode: string | null;
  }>({
    isConnected: false,
    telegramChatId: null,
    pairingCode: null,
  });

  const [copied, setCopied] = useState(false);

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "moneytracker_pwa_bot";

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTelegramStatus();
      if (res.success) {
        setStatus({
          isConnected: res.isConnected ?? false,
          telegramChatId: res.telegramChatId ?? null,
          pairingCode: res.pairingCode ?? null,
        });
      }
    } catch (err) {
      console.error("Gagal memuat status Telegram:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    void fetchStatus();
  }, [fetchStatus]);

  const handleGenerateCode = async () => {
    setActionLoading(true);
    try {
      const res = await generateTelegramPairingCode();
      if (res.success && res.code) {
        setStatus((prev) => ({
          ...prev,
          pairingCode: res.code,
        }));
      }
    } catch (err) {
      console.error("Gagal membuat kode pairing:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Apakah Anda yakin ingin memutuskan integrasi Telegram? Anda tidak akan bisa lagi mencatat transaksi lewat Telegram.")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await disconnectTelegram();
      if (res.success) {
        setStatus({
          isConnected: false,
          telegramChatId: null,
          pairingCode: null,
        });
      }
    } catch (err) {
      console.error("Gagal memutuskan koneksi:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-black/[0.03] dark:border-slate-800 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#E0E6FD] dark:bg-blue-950/60 flex items-center justify-center text-blue-900 dark:text-blue-300 shadow-2xs shrink-0">
            <Send className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#18181B] dark:text-slate-100">Integrasi Telegram Bot</h3>
          </div>
        </div>
        <div className="h-10 bg-surface-muted/60 dark:bg-slate-800/60 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-black/[0.03] dark:border-slate-800 shadow-xs flex flex-col gap-4 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#E0E6FD] dark:bg-blue-950/60 flex items-center justify-center text-blue-900 dark:text-blue-300 shadow-2xs shrink-0">
            <Send className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#18181B] dark:text-slate-100">Integrasi Telegram Bot</h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              Catat pemasukan & pengeluaran lebih cepat via bot chat Telegram
            </p>
          </div>
        </div>

        {!loading && (
          <span
            className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0",
              status.isConnected
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
            )}
          >
            {status.isConnected ? "Terhubung" : "Belum Terhubung"}
          </span>
        )}
      </div>

      <div className="pt-1">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-stone-400 dark:text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-xs font-medium">Memuat status Telegram...</span>
          </div>
        ) : status.isConnected ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 p-4 flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-emerald-900 dark:text-emerald-200">Telegram Berhasil Terhubung! 🎉</p>
                <p className="text-emerald-800 dark:text-emerald-300 mt-1">
                  Kirim pesan langsung ke bot Telegram untuk mencatat transaksi keuangan secara otomatis.
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-stone-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 py-1 px-3 rounded-full w-max border border-emerald-200/40 dark:border-emerald-800/40">
                  <span>Chat ID:</span>
                  <code className="font-mono font-bold text-[#18181B] dark:text-slate-100">{status.telegramChatId}</code>
                </div>
              </div>
            </div>

            <div className="bg-surface-muted/50 dark:bg-slate-800/80 rounded-2xl p-4 border border-black/[0.03] dark:border-white/[0.04] space-y-2">
              <p className="text-xs font-bold text-[#18181B] dark:text-slate-100">💡 Format Chat Bot Telegram:</p>
              <ul className="text-xs text-stone-600 dark:text-slate-300 space-y-1.5 list-disc pl-4">
                <li>
                  <span className="font-bold text-stone-900 dark:text-slate-100">Pengeluaran:</span> Cukup ketik nominal dan nama barang.
                  <br />
                  Contoh: <code className="font-mono font-bold text-[#E85024] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-lg border border-black/[0.04] dark:border-slate-700">25000 kopi susu</code>
                </li>
                <li>
                  <span className="font-bold text-stone-900 dark:text-slate-100">Pemasukan:</span> Berikan tanda plus <code className="font-bold text-emerald-700 dark:text-emerald-400">+</code> di awal.
                  <br />
                  Contoh: <code className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-lg border border-black/[0.04] dark:border-slate-700">+500000 bonus project</code>
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={handleDisconnect}
              className="w-full text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-900/60 rounded-full h-11 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
              Putuskan Koneksi Telegram
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-200">Hubungkan Bot Telegram</p>
                <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                  Dapatkan kode token pairing untuk dikirimkan ke bot Telegram agar akun terhubung dengan aman.
                </p>
              </div>
            </div>

            {status.pairingCode ? (
              <div className="bg-surface-muted/50 dark:bg-slate-800/80 rounded-2xl p-4 border border-black/[0.03] dark:border-white/[0.04] space-y-4">
                <div className="text-center space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500 dark:text-slate-400 block">
                    KODE PAIRING ANDA (Aktif 10 Menit)
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl font-black tracking-widest text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-5 py-2.5 rounded-2xl border border-black/[0.06] dark:border-slate-700 shadow-xs">
                      {status.pairingCode}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-2xl bg-white dark:bg-slate-900 border-black/[0.06] dark:border-slate-700 shadow-xs cursor-pointer active:scale-95"
                      onClick={() => copyToClipboard(`/start ${status.pairingCode}`)}
                      title="Salin Perintah"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-4 w-4 text-stone-700 dark:text-slate-300" />}
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-stone-600 dark:text-slate-300 space-y-1 pl-3 border-l-2 border-blue-500">
                  <p className="font-bold text-[#18181B] dark:text-slate-100">Langkah penyambungan:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Salin kode perintah di atas.</li>
                    <li>Buka bot Telegram melalui tombol di bawah.</li>
                    <li>Kirimkan perintah tersebut ke dalam bot chat.</li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <a
                    href={`https://t.me/${botUsername}?start=${status.pairingCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full bg-[#1A1A1A] hover:bg-stone-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 rounded-full h-11 text-xs font-bold gap-2 shadow-xs cursor-pointer active:scale-95 transition-all">
                      <Send className="h-4 w-4" />
                      Buka Bot Telegram
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    onClick={fetchStatus}
                    className="rounded-full h-11 px-5 text-xs font-bold border-stone-200 dark:border-slate-700 cursor-pointer active:scale-95 transition-all"
                  >
                    Cek Status
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleGenerateCode}
                disabled={actionLoading}
                className="w-full bg-[#1A1A1A] hover:bg-stone-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 rounded-full h-11 text-xs font-bold gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Buat Kode Pairing Telegram
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
