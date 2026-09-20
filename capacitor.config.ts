export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  ios?: {
    contentInset?: "always" | "never" | "automatic";
    preferredContentMode?: "mobile" | "desktop";
    allowsLinkPreview?: boolean;
    scrollEnabled?: boolean;
  };
  server?: {
    url?: string;
    cleartext?: boolean;
    androidScheme?: string;
  };
  plugins?: Record<string, unknown>;
}

const config: CapacitorConfig = {
  appId: "com.moneytracker.app",
  appName: "MoneyTracker",
  webDir: "public",
  ios: {
    // Menyesuaikan safe-area dan statusbar di iOS
    contentInset: "always",
    preferredContentMode: "mobile",
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  server: {
    // Ganti URL ini dengan domain live deployment Next.js Anda (misal Vercel) jika menggunakan mode Live URL
    url: "https://moneyv1.vercel.app/",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0b0f1a",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
