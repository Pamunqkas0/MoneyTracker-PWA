import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, CacheFirst, ExpirationPlugin, Serwist } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const self: any;



const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ url }) =>
      url.hostname.endsWith("tradingview.com") ||
      url.hostname.endsWith("tradingview-widget.com"),
    handler: new NetworkOnly({
      fetchOptions: {
        keepalive: false,
      },
    }),
  },
  {
    matcher: ({ url }) => url.hostname.endsWith(".supabase.co"),
    handler: new NetworkOnly({
      fetchOptions: {
        keepalive: false,
      },
    }),
  },
  {
    matcher: ({ url }) => url.hostname === "raw.githubusercontent.com",
    handler: new CacheFirst({
      cacheName: "github-emojis-cache",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 500, // cache up to 500 emojis (frequently used ones)
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    }),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();
