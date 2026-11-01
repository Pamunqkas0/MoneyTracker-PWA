import { webcrypto } from 'crypto';
(globalThis as any).crypto = webcrypto;

// Copy functions from lib/crypto-utils.ts
function buf2hex(buffer: Uint8Array | ArrayBuffer) {
  return Array.prototype.map.call(new Uint8Array(buffer as ArrayBuffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

function hex2buf(hexString: string) {
  const result = [];
  for (let i = 0; i < hexString.length; i += 2) {
    result.push(parseInt(hexString.substring(i, i + 2), 16));
  }
  return new Uint8Array(result);
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encryptSession(sessionData: string, pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const enc = new TextEncoder();
  const encodedData = enc.encode(sessionData);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encodedData
  );
  return `${buf2hex(salt)}:${buf2hex(iv)}:${buf2hex(ciphertext)}`;
}

async function decryptSession(encryptedString: string, pin: string): Promise<string> {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted data format');
  const [saltHex, ivHex, cipherHex] = parts;
  const salt = hex2buf(saltHex);
  const iv = hex2buf(ivHex);
  const ciphertext = hex2buf(cipherHex);
  const key = await deriveKey(pin, salt);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );
  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

async function run() {
  try {
    const pin = "999999";
    const data = "super secret session data";
    console.log("Encrypting...");
    const enc = await encryptSession(data, pin);
    console.log("Encrypted:", enc);
    console.log("Decrypting...");
    const dec = await decryptSession(enc, pin);
    console.log("Decrypted:", dec);
    console.log("Success:", dec === data);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
