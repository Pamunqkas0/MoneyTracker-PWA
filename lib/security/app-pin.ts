const PBKDF2_ITERATIONS = 120_000;

export const APP_PIN_KEY = "mt_app_pin";
export const APP_PIN_CHANGED_EVENT = "mt-app-pin-changed";

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function hashAppPin(pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );

  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(new Uint8Array(derived))}`;
}

export async function verifyAppPin(pin: string, storedPin: string) {
  // Support PINs saved by older versions and upgrade them after a successful unlock.
  if (/^\d{4}$/.test(storedPin)) return pin === storedPin;

  const [algorithm, iterationsValue, saltValue, hashValue] = storedPin.split("$");
  const iterations = Number.parseInt(iterationsValue, 10);
  if (
    algorithm !== "pbkdf2-sha256" ||
    !Number.isInteger(iterations) ||
    iterations < 1 ||
    !saltValue ||
    !hashValue
  ) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(saltValue), iterations, hash: "SHA-256" },
    key,
    256
  );
  return toHex(new Uint8Array(derived)) === hashValue;
}
