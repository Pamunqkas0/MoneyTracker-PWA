import { NetworkOnly } from "serwist";
const handler = new NetworkOnly({
  fetchOptions: {
    keepalive: false
  }
});
console.log(handler);
