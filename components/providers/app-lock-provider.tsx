"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Lock, Delete, ShieldCheck } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { APP_PIN_CHANGED_EVENT, APP_PIN_KEY, hashAppPin, verifyAppPin } from "@/lib/security/app-pin";

const LAST_INACTIVE_KEY = "mt_last_inactive_time";
const UNLOCKED_KEY = "mt_app_unlocked";
const FAILED_ATTEMPTS_KEY = "mt_app_pin_failed_attempts";
const LOCKOUT_UNTIL_KEY = "mt_app_pin_lockout_until";
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [inputPin, setInputPin] = useState("");
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [mounted, setMounted] = useState(false);
  const lockTimerRef = useRef<number | null>(null);
  const inactiveAtRef = useRef<number | null>(null);

  const lockApp = useCallback(() => {
    setIsLocked(true);
    setInputPin("");
    setError(false);
    sessionStorage.removeItem(UNLOCKED_KEY);
    localStorage.removeItem(LAST_INACTIVE_KEY);
  }, []);

  const getBackgroundTimeout = useCallback(() => {
    const value = Number.parseInt(localStorage.getItem("mt_app_lock_timeout") ?? "60", 10);
    return Number.isFinite(value) && value >= 0 ? value * 1000 : 60_000;
  }, []);

  // Inisialisasi awal
  useEffect(() => {
    const savedPin = localStorage.getItem(APP_PIN_KEY);
    if (savedPin) {
      setPin(savedPin);
      // Always lock on a fresh PWA/page launch, even if sessionStorage survived.
      sessionStorage.removeItem(UNLOCKED_KEY);
      setIsLocked(true);
    }
    setMounted(true);
  }, []);

  // Lock after returning from the background, and detect PIN changes made in settings.
  useEffect(() => {
    const markInactive = () => {
      if (!localStorage.getItem(APP_PIN_KEY)) return;
      if (inactiveAtRef.current === null) {
        inactiveAtRef.current = Date.now();
        localStorage.setItem(LAST_INACTIVE_KEY, String(inactiveAtRef.current));
      }
      if (getBackgroundTimeout() === 0) lockApp();
    };

    const checkBackgroundReturn = () => {
      if (!localStorage.getItem(APP_PIN_KEY)) return;
      const lastInactive = inactiveAtRef.current ?? Number(localStorage.getItem(LAST_INACTIVE_KEY));
      if (!lastInactive) return;

      const elapsed = Date.now() - lastInactive;
      if (getBackgroundTimeout() === 0 || elapsed >= getBackgroundTimeout()) {
        lockApp();
      } else {
        localStorage.removeItem(LAST_INACTIVE_KEY);
        inactiveAtRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") markInactive();
      else checkBackgroundReturn();
    };
    const handlePinChanged = () => {
      const savedPin = localStorage.getItem(APP_PIN_KEY);
      setPin(savedPin ?? "");
      inactiveAtRef.current = null;
      if (savedPin) lockApp();
      else {
        setIsLocked(false);
        sessionStorage.removeItem(UNLOCKED_KEY);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", markInactive);
    window.addEventListener("blur", markInactive);
    window.addEventListener("focus", checkBackgroundReturn);
    window.addEventListener(APP_PIN_CHANGED_EVENT, handlePinChanged);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", markInactive);
      window.removeEventListener("blur", markInactive);
      window.removeEventListener("focus", checkBackgroundReturn);
      window.removeEventListener(APP_PIN_CHANGED_EVENT, handlePinChanged);
    };
  }, [getBackgroundTimeout, lockApp]);

  // Lock after five minutes without interaction, even if the PWA stays visible.
  useEffect(() => {
    if (!mounted || !pin || isLocked) return;

    const resetIdleTimer = () => {
      if (lockTimerRef.current !== null) window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = window.setTimeout(lockApp, IDLE_TIMEOUT_MS);
    };
    const activityEvents: (keyof WindowEventMap)[] = ["pointerdown", "pointermove", "keydown", "touchstart", "scroll"];
    activityEvents.forEach((event) => window.addEventListener(event, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      if (lockTimerRef.current !== null) window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
      activityEvents.forEach((event) => window.removeEventListener(event, resetIdleTimer));
    };
  }, [mounted, pin, isLocked, lockApp]);

  // Keep the retry delay across reloads so refreshing cannot clear the PIN cooldown.
  useEffect(() => {
    const updateLockout = () => {
      const until = Number(localStorage.getItem(LOCKOUT_UNTIL_KEY) ?? 0);
      setLockoutRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
      if (until <= Date.now()) localStorage.removeItem(LOCKOUT_UNTIL_KEY);
    };
    updateLockout();
    const timer = window.setInterval(updateLockout, 1000);
    return () => window.clearInterval(timer);
  }, [isLocked]);

  const handleKeyPress = (num: string) => {
    if (inputPin.length < 4 && !isVerifying && lockoutRemaining === 0) {
      triggerHaptic("light");
      const newPin = inputPin + num;
      setInputPin(newPin);
      setError(false);

      if (newPin.length === 4) {
        setIsVerifying(true);
        void (async () => {
          try {
            const isValid = await verifyAppPin(newPin, pin);
            if (isValid) {
              // Migrate any PIN saved in plaintext by the previous version.
              if (/^\d{4}$/.test(pin)) {
                const hashedPin = await hashAppPin(newPin);
                localStorage.setItem(APP_PIN_KEY, hashedPin);
                setPin(hashedPin);
              }

              triggerHaptic("success");
              localStorage.setItem(FAILED_ATTEMPTS_KEY, "0");
              localStorage.removeItem(LOCKOUT_UNTIL_KEY);
              sessionStorage.setItem(UNLOCKED_KEY, "true");
              localStorage.removeItem(LAST_INACTIVE_KEY);
              inactiveAtRef.current = null;
              setIsLocked(false);
              setInputPin("");
            } else {
              triggerHaptic("error");
              setError(true);
              setInputPin("");
              const attempts = Number(localStorage.getItem(FAILED_ATTEMPTS_KEY) ?? 0) + 1;
              localStorage.setItem(FAILED_ATTEMPTS_KEY, String(attempts));
              if (attempts >= 5) {
                const cooldownMs = Math.min(30_000 * 2 ** (attempts - 5), 5 * 60_000);
                localStorage.setItem(LOCKOUT_UNTIL_KEY, String(Date.now() + cooldownMs));
                setLockoutRemaining(Math.ceil(cooldownMs / 1000));
              }
              window.setTimeout(() => setError(false), 600);
            }
          } catch {
            setError(true);
            setInputPin("");
            window.setTimeout(() => setError(false), 600);
          } finally {
            setIsVerifying(false);
          }
        })();
      }
    }
  };

  const handleDelete = () => {
    if (isVerifying || lockoutRemaining > 0) return;
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
        {lockoutRemaining > 0 ? (
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 -mt-6 mb-6">
            Terlalu banyak percobaan. Coba lagi dalam {lockoutRemaining} detik.
          </p>
        ) : error ? (
          <p className="text-xs font-bold text-rose-500 -mt-6 mb-6 animate-fade-in">
            PIN salah. Coba lagi.
          </p>
        ) : null}

        {/* Numpad 3x4 */}
        <div className="grid grid-cols-3 gap-3.5 sm:gap-4 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              disabled={isVerifying || lockoutRemaining > 0}
              className="flex h-16 items-center justify-center rounded-2xl text-2xl font-black bg-white dark:bg-slate-800/90 text-stone-900 dark:text-white border border-black/[0.04] dark:border-slate-700/60 hover:bg-stone-50 dark:hover:bg-slate-700 active:scale-90 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
            disabled={isVerifying || lockoutRemaining > 0}
            className="flex h-16 items-center justify-center rounded-2xl text-2xl font-black bg-white dark:bg-slate-800/90 text-stone-900 dark:text-white border border-black/[0.04] dark:border-slate-700/60 hover:bg-stone-50 dark:hover:bg-slate-700 active:scale-90 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isVerifying || lockoutRemaining > 0}
            className="flex h-16 items-center justify-center rounded-2xl text-xl bg-white dark:bg-slate-800/90 border border-black/[0.04] dark:border-slate-700/60 hover:bg-stone-50 dark:hover:bg-slate-700 active:scale-90 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
