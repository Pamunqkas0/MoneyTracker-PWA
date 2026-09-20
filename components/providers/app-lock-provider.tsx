"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Lock, Delete, ShieldCheck, RefreshCw } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [inputPin, setInputPin] = useState("");
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lockTimeoutRef = useRef<number>(0);

  // Fungsi untuk memeriksa apakah aplikasi harus terkunci berdasarkan timeout
  const checkShouldLock = useCallback((savedPin: string) => {
    if (!savedPin) return;

    const timeoutStr = localStorage.getItem("mt_app_lock_timeout") || "0";
    const timeoutSeconds = parseInt(timeoutStr, 10);
    lockTimeoutRef.current = timeoutSeconds;

    const lastInactiveStr = localStorage.getItem("mt_last_inactive_time");
    const isSessionUnlocked = sessionStorage.getItem("mt_app_unlocked") === "true";

    // Jika belum pernah unlock di session ini -> wajib kunci
    if (!isSessionUnlocked) {
      setIsLocked(true);
      return;
    }

    // Jika mode: Langsung (0 detik) -> kunci langsung saat kembali
    if (timeoutSeconds === 0 && lastInactiveStr) {
      setIsLocked(true);
      sessionStorage.removeItem("mt_app_unlocked");
      return;
    }

    // Jika mode timeout berdurasi (misal 60 detik / 300 detik)
    if (timeoutSeconds > 0 && lastInactiveStr) {
      const elapsedSeconds = (Date.now() - parseInt(lastInactiveStr, 10)) / 1000;
      if (elapsedSeconds >= timeoutSeconds) {
        setIsLocked(true);
        sessionStorage.removeItem("mt_app_unlocked");
      }
    }
  }, []);

  // Inisialisasi awal
  useEffect(() => {
    const savedPin = localStorage.getItem("mt_app_pin");
    if (savedPin) {
      setPin(savedPin);
      checkShouldLock(savedPin);
    }
    setMounted(true);
  }, [checkShouldLock]);

  // Lifecycle listeners (PWA close, minimize, tab switch, screen lock)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const savedPin = localStorage.getItem("mt_app_pin");
      if (!savedPin) return;

      if (document.visibilityState === "hidden") {
        // Pengguna meninggalkan / minimize / mengunci layar HP
        localStorage.setItem("mt_last_inactive_time", Date.now().toString());
        const timeoutStr = localStorage.getItem("mt_app_lock_timeout") || "0";
        if (timeoutStr === "0") {
          sessionStorage.removeItem("mt_app_unlocked");
        }
      } else if (document.visibilityState === "visible") {
        // Pengguna kembali membuka PWA
        checkShouldLock(savedPin);
      }
    };

    const handlePageHide = () => {
      const savedPin = localStorage.getItem("mt_app_pin");
      if (!savedPin) return;
      localStorage.setItem("mt_last_inactive_time", Date.now().toString());
      const timeoutStr = localStorage.getItem("mt_app_lock_timeout") || "0";
      if (timeoutStr === "0") {
        sessionStorage.removeItem("mt_app_unlocked");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("blur", handlePageHide);
    window.addEventListener("focus", () => {
      const savedPin = localStorage.getItem("mt_app_pin");
      if (savedPin) checkShouldLock(savedPin);
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("blur", handlePageHide);
    };
  }, [checkShouldLock]);

  const handleKeyPress = (num: string) => {
    if (inputPin.length < 4) {
      triggerHaptic("light");
      const newPin = inputPin + num;
      setInputPin(newPin);
      setError(false);

      if (newPin.length === 4) {
        if (newPin === pin) {
          triggerHaptic("success");
          sessionStorage.setItem("mt_app_unlocked", "true");
          localStorage.removeItem("mt_last_inactive_time");
          setIsLocked(false);
          setInputPin("");
        } else {
          triggerHaptic("error");
          setError(true);
          setTimeout(() => {
            setInputPin("");
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    triggerHaptic("selection");
    setInputPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  if (!mounted) return null;

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#F7F4EE] dark:bg-[#0b0f1a] text-[#18181B] dark:text-slate-100 flex flex-col items-center justify-center p-6 select-none transition-colors">
        {/* Header Icon */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FDD5C1] dark:bg-orange-950/60 text-[#E85024] shadow-sm">
          <Lock className="h-8 w-8 stroke-[2.3]" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black mb-1.5 tracking-tight text-center">
          Aplikasi Terkunci
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mb-8 text-center max-w-xs">
          Masukkan 4 digit PIN untuk membuka kembali MoneyTracker
        </p>

        {/* 4-Digit Indicator Dots */}
        <div className="flex gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 border ${
                i < inputPin.length
                  ? "bg-[#E85024] border-[#E85024] scale-110 shadow-sm"
                  : error
                  ? "bg-rose-500 border-rose-500 animate-shake"
                  : "bg-white dark:bg-slate-800 border-stone-300 dark:border-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Error notification */}
        {error && (
          <p className="text-xs font-bold text-rose-500 -mt-6 mb-6 animate-fade-in">
            PIN salah. Coba lagi.
          </p>
        )}

        {/* Numpad 3x4 */}
        <div className="grid grid-cols-3 gap-3.5 sm:gap-4 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              className="flex h-16 items-center justify-center rounded-2xl text-2xl font-black bg-white dark:bg-slate-800/90 text-stone-900 dark:text-white border border-black/[0.04] dark:border-slate-700/60 hover:bg-stone-50 dark:hover:bg-slate-700 active:scale-90 transition-all shadow-xs cursor-pointer"
            >
              {num}
            </button>
          ))}
          <div className="flex items-center justify-center text-xs text-stone-400 font-bold">
            <ShieldCheck className="w-5 h-5 opacity-40" />
          </div>
          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="flex h-16 items-center justify-center rounded-2xl text-2xl font-black bg-white dark:bg-slate-800/90 text-stone-900 dark:text-white border border-black/[0.04] dark:border-slate-700/60 hover:bg-stone-50 dark:hover:bg-slate-700 active:scale-90 transition-all shadow-xs cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex h-16 items-center justify-center rounded-2xl text-xl bg-white dark:bg-slate-800/90 border border-black/[0.04] dark:border-slate-700/60 hover:bg-stone-50 dark:hover:bg-slate-700 active:scale-90 transition-all shadow-xs cursor-pointer"
            aria-label="Hapus Digit"
          >
            <Delete className="h-6 w-6 text-stone-600 dark:text-slate-300" />
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
