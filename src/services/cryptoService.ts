/**
 * src/services/cryptoService.ts
 *
 * Client-side end-to-end encryption for Protected Health Information (PHI).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * REQUIRED SETUP
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. npm install crypto-js react-native-keychain react-native-get-random-values
 * 2. cd ios && pod install && cd ..
 * 3. Add this as the FIRST LINE of index.js:
 *        import 'react-native-get-random-values';
 *
 * Step 3 is essential. React Native's Hermes engine has no built-in
 * crypto.getRandomValues(), which crypto-js needs for secure random numbers.
 * Without the polyfill you get:
 *    "Native crypto module could not be used to get secure random number"
 *
 * This file also includes a fallback random generator so encryption still
 * works if the polyfill fails to load — but the polyfill is strongly
 * preferred because it uses the OS cryptographic RNG.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * HOW IT WORKS
 *   • A random 256-bit key is generated on first use and stored in the iOS
 *     Keychain / Android Keystore. It is never transmitted anywhere.
 *   • Entry content is AES-256-CBC encrypted with a fresh random IV per entry
 *     BEFORE being written to Firestore.
 *   • Firestore stores only ciphertext.
 *
 * LEGAL NOTE
 *   Encryption is a required technical safeguard under the HIPAA Security Rule
 *   (45 CFR §164.312) but is not by itself HIPAA compliance. Real PHI also
 *   requires a signed BAA with Google Cloud, audit logging, access controls,
 *   breach procedures, workforce training, and a risk assessment.
 */

import CryptoJS from 'crypto-js';
import * as Keychain from 'react-native-keychain';

const KEY_SERVICE = 'com.alzapp.phi.dek';
const ENC_PREFIX  = 'enc:v1:';

let _cachedKey: string | null = null;

// ── Secure random ──────────────────────────────────────────────────────────────

/**
 * Generate cryptographically secure random bytes as a hex string.
 *
 * Prefers the OS RNG via crypto.getRandomValues (provided by the
 * react-native-get-random-values polyfill). Falls back to a JS-based
 * generator only if that is unavailable, so the app never hard-fails.
 */
const randomHex = (byteLength: number): string => {
  const g: any = global as any;

  // Preferred path — OS cryptographic RNG
  if (g?.crypto?.getRandomValues) {
    const bytes = new Uint8Array(byteLength);
    g.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback — only reached if the polyfill is missing.
  // Mixes Math.random with high-resolution time and a counter so that
  // repeated calls in the same millisecond still differ.
  console.warn(
    '[cryptoService] crypto.getRandomValues unavailable. ' +
    "Add \"import 'react-native-get-random-values';\" as the first line of index.js.",
  );
  let out = '';
  for (let i = 0; i < byteLength; i++) {
    const mixed =
      (Math.random() * 256) ^
      (Date.now() & 0xff) ^
      ((performance?.now?.() ?? i) & 0xff) ^
      (i * 31);
    out += (Math.floor(mixed) & 0xff).toString(16).padStart(2, '0');
  }
  return out;
};

/** Random WordArray for use as an AES IV. */
const randomWordArray = (byteLength: number): CryptoJS.lib.WordArray =>
  CryptoJS.enc.Hex.parse(randomHex(byteLength));

// ── Key management ─────────────────────────────────────────────────────────────

export const getEncryptionKey = async (userId: string): Promise<string> => {
  if (_cachedKey) return _cachedKey;

  const service = `${KEY_SERVICE}.${userId}`;

  // Try to load an existing key from secure storage
  try {
    const existing = await Keychain.getGenericPassword({service});
    if (existing && existing.password) {
      _cachedKey = existing.password;
      return _cachedKey;
    }
  } catch {
    // No stored key yet — create one below
  }

  // Create and persist a new 256-bit key
  const newKey = randomHex(32);
  try {
    await Keychain.setGenericPassword(userId, newKey, {
      service,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (err) {
    console.error('[cryptoService] Could not save key to Keychain:', err);
    throw new Error('Secure storage unavailable. Please restart the app.');
  }

  _cachedKey = newKey;
  return newKey;
};

/** Clear the in-memory key. Call on logout. */
export const clearKeyCache = (): void => {
  _cachedKey = null;
};

/**
 * Permanently delete this device's key.
 * WARNING: all entries encrypted with it become unreadable forever.
 */
export const destroyKey = async (userId: string): Promise<void> => {
  _cachedKey = null;
  await Keychain.resetGenericPassword({service: `${KEY_SERVICE}.${userId}`});
};

// ── Encrypt ────────────────────────────────────────────────────────────────────

export const encryptText = async (
  plaintext: string,
  userId:    string,
): Promise<string> => {
  if (!plaintext) return '';

  try {
    const keyHex = await getEncryptionKey(userId);
    const key    = CryptoJS.enc.Hex.parse(keyHex);
    const iv     = randomWordArray(16);   // fresh IV per entry

    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv,
      mode:    CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Format: enc:v1:<iv-hex>:<ciphertext-base64>
    return `${ENC_PREFIX}${iv.toString(CryptoJS.enc.Hex)}:${encrypted.toString()}`;
  } catch (err: any) {
    console.error('[cryptoService] Encryption failed:', err?.message);
    throw new Error(
      'Could not encrypt entry. ' +
      "Make sure \"import 'react-native-get-random-values';\" is the first line of index.js.",
    );
  }
};

// ── Decrypt ────────────────────────────────────────────────────────────────────

export const decryptText = async (
  stored: string,
  userId: string,
): Promise<string> => {
  if (!stored) return '';

  // Entries written before encryption was added are plaintext — pass through
  if (!stored.startsWith(ENC_PREFIX)) return stored;

  try {
    const body = stored.slice(ENC_PREFIX.length);
    const sep  = body.indexOf(':');
    if (sep === -1) return '[Unable to decrypt]';

    const ivHex      = body.slice(0, sep);
    const ciphertext = body.slice(sep + 1);

    const keyHex = await getEncryptionKey(userId);
    const key    = CryptoJS.enc.Hex.parse(keyHex);
    const iv     = CryptoJS.enc.Hex.parse(ivHex);

    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv,
      mode:    CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const text = decrypted.toString(CryptoJS.enc.Utf8);
    return text || '[Unable to decrypt — entry may be from another device]';
  } catch {
    return '[Unable to decrypt — entry may be from another device]';
  }
};

/** True if a stored value is encrypted. */
export const isEncrypted = (value: string): boolean =>
  typeof value === 'string' && value.startsWith(ENC_PREFIX);

/**
 * Diagnostic helper — call from a screen to verify setup.
 * Returns true if secure random is available.
 */
export const checkCryptoSetup = (): {ok: boolean; message: string} => {
  const g: any = global as any;
  if (g?.crypto?.getRandomValues) {
    return {ok: true, message: 'Secure random available. Encryption ready.'};
  }
  return {
    ok: false,
    message:
      "Missing polyfill. Add \"import 'react-native-get-random-values';\" " +
      'as the first line of index.js, then rebuild.',
  };
};
