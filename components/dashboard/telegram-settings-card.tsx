"use client";

import { useEffect, useState, useCallback } from "react";
import { Send, Loader2, CheckCircle2, XCircle, AlertCircle, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <Card className="shadow-sm border-[var(--card-border)]">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold">Integrasi Telegram</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
          <div className="h-10 bg-[var(--muted)] animate-pulse rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-[var(--card-border)]">
      <CardHeader className="p-4 sm:p-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 shrink-0">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold">Integrasi Telegram</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs mt-0.5">
                Catat pemasukan & pengeluaran lebih cepat via chat Telegram secara gratis
              </CardDescription>
            </div>
          </div>
          {!loading && (
            <Badge
              variant="outline"
              className={
                status.isConnected
                  ? "border-emerald-500/20 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5"
                  : "border-amber-500/20 text-amber-700 dark:text-amber-400 bg-amber-500/5"
              }
            >
              {status.isConnected ? "Terhubung" : "Belum Terhubung"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
            <span className="text-xs text-[var(--muted-foreground)] ml-2">Memuat status...</span>
          </div>
        ) : status.isConnected ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3.5 flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-[var(--foreground)]">Telegram Berhasil Terhubung!</p>
                <p className="text-[var(--muted-foreground)] mt-1">
                  Sekarang Anda bisa mengetik langsung transaksi Anda ke bot Telegram untuk dicatat otomatis.
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] bg-[var(--muted)]/50 py-1 px-2.5 rounded-lg w-max">
                  <span>Chat ID Anda:</span>
                  <code className="font-mono font-bold text-[var(--foreground)]">{status.telegramChatId}</code>
                </div>
              </div>
            </div>

            <div className="bg-[var(--muted)]/40 rounded-xl p-4 border border-[var(--card-border)]/30 space-y-2.5">
              <p className="text-xs font-bold text-[var(--foreground)]">💡 Panduan Format Chat Telegram:</p>
              <ul className="text-xs text-[var(--muted-foreground)] space-y-1.5 list-disc pl-4">
                <li>
                  <span className="font-semibold text-[var(--foreground)]">Pengeluaran:</span> Cukup ketik <code className="font-mono bg-[var(--muted)] px-1 py-0.5 rounded text-amber-600 dark:text-amber-400">[jumlah] [nama_barang]</code>.
                  <br />
                  Contoh: <code className="font-mono font-bold text-[var(--foreground)]">25000 kopi susu</code>
                </li>
                <li>
                  <span className="font-semibold text-[var(--foreground)]">Pemasukan:</span> Berikan tanda tambah <code className="font-mono bg-[var(--muted)] px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">+</code> di awal.
                  <br />
                  Contoh: <code className="font-mono font-bold text-[var(--foreground)]">+500000 bonus project</code>
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={handleDisconnect}
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-950/20 rounded-xl transition-all active:scale-[0.98]"
            >
              {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
              Putuskan Koneksi Telegram
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3.5 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-[var(--foreground)]">Hubungkan Dengan Mudah & Cepat</p>
                <p className="text-[var(--muted-foreground)] mt-0.5">
                  Anda akan mendapatkan token rahasia untuk dikirimkan ke bot Telegram agar akun Anda terintegrasi secara aman.
                </p>
              </div>
            </div>

            {status.pairingCode ? (
              <div className="bg-[var(--muted)]/50 rounded-xl p-4 border border-[var(--card-border)]/50 space-y-4">
                <div className="text-center space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--muted-foreground)] block">
                    KODE PAIRING ANDA (Aktif 10 Menit)
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl font-bold tracking-widest text-blue-600 dark:text-blue-400 bg-[var(--background)] px-4 py-2 rounded-xl border border-[var(--card-border)] shadow-sm">
                      {status.pairingCode}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-xl"
                      onClick={() => copyToClipboard(`/start ${status.pairingCode}`)}
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-[var(--muted-foreground)] space-y-2 pl-2 border-l-2 border-blue-500">
                  <p className="font-semibold text-[var(--foreground)]">Langkah penyambungan:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Salin tombol kode di atas (berupa perintah chat).</li>
                    <li>Buka bot Telegram kami di link tombol di bawah.</li>
                    <li>Tempel (paste) kode ke dalam chat dan kirimkan.</li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <a
                    href={`https://t.me/${botUsername}?start=${status.pairingCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl gap-2 transition-all active:scale-[0.98]">
                      <Send className="h-4 w-4" />
                      Buka Telegram Bot
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    onClick={fetchStatus}
                    className="rounded-xl gap-1.5 transition-all active:scale-[0.98]"
                  >
                    Cek Status Koneksi
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleGenerateCode}
                disabled={actionLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl gap-2 transition-all active:scale-[0.98]"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Hubungkan Akun Telegram
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
