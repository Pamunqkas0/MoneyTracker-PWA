"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default true to prevent flash
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Cek apakah sudah di-install (standalone mode)
    const checkStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(checkStandalone);

    if (checkStandalone) return;

    // Cek apakah user pernah dismiss prompt ini sebelumnya
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed === "true") return;

    // Cek device iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // Tampilkan prompt untuk iOS setelah delay
      setTimeout(() => setShowPrompt(true), 3000);
    } else {
      // Tangkap event install prompt bawaan Chrome/Android
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setTimeout(() => setShowPrompt(true), 3000);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-96"
      >
        <div className="bg-white/95 border border-black/[0.06] rounded-[28px] shadow-2xl p-4 sm:p-5 flex gap-3.5 items-start relative overflow-hidden backdrop-blur-md">
          <div className="bg-[#FDD5C1] text-[#E85024] p-3 rounded-2xl shrink-0 mt-0.5 shadow-2xs">
            <Download className="h-5 w-5 stroke-[2.2]" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-sm font-bold text-[#18181B]">
              Pasang SavOr MoneyTracker
            </h3>
            {isIOS ? (
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Tap <Share className="inline h-3.5 w-3.5 mx-0.5 text-stone-700" /> lalu pilih{" "}
                <strong className="text-[#18181B] font-semibold">Add to Home Screen</strong>{" "}
                untuk akses offline & instan.
              </p>
            ) : (
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Pasang aplikasi di layar utama untuk akses instan dan offline tanpa hambatan.
              </p>
            )}

            {!isIOS && (
              <Button
                onClick={handleInstall}
                size="sm"
                className="mt-3 w-full bg-[#E85024] hover:bg-[#d44319] text-white font-bold rounded-full text-xs h-10 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
              >
                Pasang Sekarang
              </Button>
            )}
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Tutup"
            className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-700 p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

