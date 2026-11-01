import { defaultCache } from "@serwist/next/worker";
console.log(defaultCache.map(c => c.matcher.toString()));
