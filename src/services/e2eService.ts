/**
 * src/services/e2eService.ts
 *
 * End-to-end encryption for 1-to-1 messaging (chat + Thank You Notes).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS DIFFERENT FROM cryptoService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * cryptoService uses a symmetric key stored on one device. That works for the
 * journal because only the author ever reads it.
 *
 * Chat has TWO readers, so a device-local key cannot work. This module uses
 * public-key cryptography (NaCl box = Curve25519 ECDH + XSalsa20-Poly1305):
 *
 *   • Each user generates a KEYPAIR on first use.
 *   • The PUBLIC key is published to /users/{uid}.publicKey — safe to share.
 *   • The SECRET key is stored in the iOS Keychain / Android Keystore and
 *     never leaves the device.
 *   • To send: encrypt with (my secret key + their public key).
 *   • To read: decrypt with (my secret key + their public key).
 *
 * Because Curve25519 ECDH produces the SAME shared secret from either side,
 * a single ciphertext is readable by both the sender and the recipient — and
 * by nobody else, including Firebase, Google, and your own team.
 *
 * SETUP REQUIRED:
 *   npm install tweetnacl tweetnacl-util --legacy-peer-deps
 *   (react-native-get-random-values must already be imported in index.js)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import * as Keychain from 'react-native-keychain';
import {doc, getDoc, updateDoc} from 'firebase/firestore';
import {db} from '../config/firebase';

const KEY_SERVICE = 'com.alzapp.e2e.secretkey';
const ENC_PREFIX  = 'e2e:v1:';

let _cachedSecretKey: Uint8Array | null = null;
const _publicKeyCache = new Map<string, Uint8Array>();

// ── Encoding helpers ───────────────────────────────────────────────────────────

const toB64   = (bytes: Uint8Array): string => naclUtil.encodeBase64(bytes);
const fromB64 = (str: string): Uint8Array  => naclUtil.decodeBase64(str);

// ── Keypair management ─────────────────────────────────────────────────────────

/**
 * Get this device's secret key, generating a keypair on first use.
 * Publishes the public key to Firestore so others can encrypt to this user.
 */
export const ensureKeyPair = async (userId: string): Promise<Uint8Array> => {
  if (_cachedSecretKey) return _cachedSecretKey;

  const service = `${KEY_SERVICE}.${userId}`;

  // Try loading an existing secret key
  try {
    const stored = await Keychain.getGenericPassword({service});
    if (stored && stored.password) {
      _cachedSecretKey = fromB64(stored.password);
      return _cachedSecretKey;
    }
  } catch {
    // none yet — generate below
  }

  // Generate a new keypair
  const pair = nacl.box.keyPair();

  await Keychain.setGenericPassword(userId, toB64(pair.secretKey), {
    service,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  // Publish the PUBLIC key so others can send us encrypted messages
  try {
    await updateDoc(doc(db, 'users', userId), {
      publicKey: toB64(pair.publicKey),
    });
  } catch (err) {
    console.error('[e2eService] Could not publish public key:', err);
  }

  _cachedSecretKey = pair.secretKey;
  return pair.secretKey;
};

/** This device's public key, as base64. */
export const getMyPublicKey = async (userId: string): Promise<string> => {
  const secret = await ensureKeyPair(userId);
  // Derive public from secret
  return toB64(nacl.box.keyPair.fromSecretKey(secret).publicKey);
};

/** Fetch another user's published public key (cached). */
export const getPublicKey = async (userId: string): Promise<Uint8Array | null> => {
  const cached = _publicKeyCache.get(userId);
  if (cached) return cached;

  try {
    const snap = await getDoc(doc(db, 'users', userId));
    const b64  = snap.data()?.publicKey;
    if (!b64) return null;
    const key = fromB64(b64);
    _publicKeyCache.set(userId, key);
    return key;
  } catch {
    return null;
  }
};

/** Clear cached keys. Call on logout. */
export const clearE2ECache = (): void => {
  _cachedSecretKey = null;
  _publicKeyCache.clear();
};

// ── Encrypt / decrypt ──────────────────────────────────────────────────────────

/**
 * Encrypt a message for a specific recipient.
 * Both sender and recipient can decrypt the result.
 * Returns plaintext unchanged if the recipient has no published key yet
 * (so messaging never hard-fails) — the caller can surface that state.
 */
export const encryptForUser = async (
  plaintext:   string,
  myUserId:    string,
  theirUserId: string,
): Promise<{ciphertext: string; encrypted: boolean}> => {
  if (!plaintext) return {ciphertext: '', encrypted: false};

  try {
    const mySecret   = await ensureKeyPair(myUserId);
    const theirPublic = await getPublicKey(theirUserId);

    if (!theirPublic) {
      // Recipient hasn't opened the app since E2E was added
      return {ciphertext: plaintext, encrypted: false};
    }

    const nonce   = nacl.randomBytes(nacl.box.nonceLength);
    const msgBytes = naclUtil.decodeUTF8(plaintext);
    const boxed    = nacl.box(msgBytes, nonce, theirPublic, mySecret);

    // Format: e2e:v1:<nonce-b64>:<ciphertext-b64>
    return {
      ciphertext: `${ENC_PREFIX}${toB64(nonce)}:${toB64(boxed)}`,
      encrypted:  true,
    };
  } catch (err: any) {
    console.error('[e2eService] Encryption failed:', err?.message);
    return {ciphertext: plaintext, encrypted: false};
  }
};

/**
 * Decrypt a message. `otherUserId` is the OTHER party in the conversation
 * (the sender if you received it, the recipient if you sent it) — the
 * shared secret is the same either way.
 */
export const decryptFromUser = async (
  stored:      string,
  myUserId:    string,
  otherUserId: string,
): Promise<string> => {
  if (!stored) return '';

  // Plaintext (legacy or unencryptable) — pass through
  if (!stored.startsWith(ENC_PREFIX)) return stored;

  try {
    const body = stored.slice(ENC_PREFIX.length);
    const sep  = body.indexOf(':');
    if (sep === -1) return '[Unable to decrypt]';

    const nonce  = fromB64(body.slice(0, sep));
    const boxed  = fromB64(body.slice(sep + 1));

    const mySecret    = await ensureKeyPair(myUserId);
    const theirPublic = await getPublicKey(otherUserId);
    if (!theirPublic) return '[Unable to decrypt — sender key unavailable]';

    const opened = nacl.box.open(boxed, nonce, theirPublic, mySecret);
    if (!opened) return '[Unable to decrypt]';

    return naclUtil.encodeUTF8(opened);
  } catch {
    return '[Unable to decrypt]';
  }
};

/** True if a value is E2E-encrypted. */
export const isE2EEncrypted = (value: string): boolean =>
  typeof value === 'string' && value.startsWith(ENC_PREFIX);
