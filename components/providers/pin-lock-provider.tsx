'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePinLock } from '@/hooks/usePinLock';
import { PinLockscreen } from '@/components/features/auth/pin-lockscreen';

interface PinLockProviderProps {
  children: React.ReactNode;
}

export function PinLockProvider({ children }: PinLockProviderProps) {
  const { isLocked, hasPin, hasSession, isReady, verifyPin, setupPin, clearPin } = usePinLock();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Define paths that don't require PIN lock (e.g. public routes)
  const isPublicRoute = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleVerify = async (pin: string) => {
    const res = await verifyPin(pin);
    if (!res.success) {
      alert("Gagal Verifikasi: " + res.error);
      // Trigger event to notify PinLockscreen to shake
      const event = new CustomEvent('pin-validation-failed');
      window.dispatchEvent(event);
    }
  };

  const handleSetup = async (pin: string) => {
    await setupPin(pin);
  };

  const handleLogout = () => {
    clearPin();
    // Redirect to login or call your actual logout method
    window.location.href = '/login';
  };

  // Prevent hydration mismatch or showing unprotected content before ready
  if (!mounted || !isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[var(--foreground)]" />
      </div>
    );
  }

  // If locked (and has a PIN), we MUST show the lockscreen, even on public routes like /login 
  // because SSR might have redirected them here due to missing cookies
  if (hasPin && isLocked) {
    return <PinLockscreen mode="verify" onSuccess={handleVerify} onLogout={handleLogout} />;
  }

  // If on a public route and not locked, just render children
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If user hasn't setup a PIN yet AND has an active session, force setup
  if (!hasPin && hasSession) {
    return <PinLockscreen mode="setup" onSuccess={handleSetup} />;
  }

  // Otherwise, normal app
  return <>{children}</>;
}
