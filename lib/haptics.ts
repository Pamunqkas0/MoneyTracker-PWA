/**
 * Utility untuk memberikan umpan balik getaran (Haptic Feedback) layaknya aplikasi native.
 * Bekerja secara otomatis di web browser mobile (Vibration API) maupun di wrapper iOS/Android (Capacitor Haptics).
 */

export type HapticType = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

export function triggerHaptic(type: HapticType = "light") {
  if (typeof window === "undefined") return;

  try {
    // 1. Cek jika Capacitor Haptics tersedia di global window (bila dibungkus native)
    const capacitorHaptics = (window as unknown as { Capacitor?: { Plugins?: { Haptics?: { impact?: (opts: { style: string }) => void; notification?: (opts: { type: string }) => void; selectionStart?: () => void; selectionChanged?: () => void } } } })
      ?.Capacitor?.Plugins?.Haptics;

    if (capacitorHaptics) {
      if (type === "success" || type === "warning" || type === "error") {
        capacitorHaptics.notification?.({ type: type.toUpperCase() });
      } else if (type === "selection") {
        capacitorHaptics.selectionChanged?.();
      } else {
        const styleMap: Record<string, string> = {
          light: "LIGHT",
          medium: "MEDIUM",
          heavy: "HEAVY",
        };
        capacitorHaptics.impact?.({ style: styleMap[type] || "LIGHT" });
      }
      return;
    }

    // 2. Fallback ke Web Vibration API standar browser mobile
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      switch (type) {
        case "selection":
        case "light":
          navigator.vibrate(10);
          break;
        case "medium":
          navigator.vibrate(20);
          break;
        case "heavy":
          navigator.vibrate(35);
          break;
        case "success":
          navigator.vibrate([15, 50, 15]);
          break;
        case "warning":
        case "error":
          navigator.vibrate([30, 40, 30]);
          break;
      }
    }
  } catch {
    // Abaikan jika device / browser tidak mendukung haptics
  }
}
