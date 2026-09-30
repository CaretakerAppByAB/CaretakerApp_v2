/**
 * src/services/mediaService.ts
 *
 * Shared image picking + Firebase Storage upload helpers used by chat
 * attachments, community posts/comments, and profile pictures.
 *
 * NOTE ON THE UPLOAD IMPLEMENTATION:
 * The `firebase/storage` JS SDK's uploader (uploadBytes AND uploadString)
 * internally wraps the file's bytes in a `Blob` before handing them to
 * XMLHttpRequest, no matter how the caller supplies the data. React
 * Native's Blob polyfill doesn't support constructing a Blob from an
 * ArrayBuffer/ArrayBufferView, so every SDK upload path fails with
 * "Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not
 * supported" on this RN version.
 *
 * To sidestep the SDK entirely, we upload directly to the Firebase Storage
 * REST endpoint via `fetch`, sending the raw bytes as an ArrayBuffer body
 * (RN's fetch/XHR sends ArrayBuffer bodies natively — no Blob involved).
 */

import {Alert} from 'react-native';
import {launchCamera, launchImageLibrary, ImagePickerResponse} from 'react-native-image-picker';
import {auth} from '../config/firebase';

const STORAGE_BUCKET = 'alzapp-f3f03.firebasestorage.app';

export interface PickedImage {
  uri:      string;
  fileName: string;
  type:     string;
  base64:   string;
}

const fromResponse = (res: ImagePickerResponse): PickedImage | null => {
  if (res.didCancel || res.errorCode || !res.assets?.length) return null;
  const asset = res.assets[0];
  if (!asset.uri || !asset.base64) return null;
  return {
    uri:      asset.uri,
    fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
    type:     asset.type ?? 'image/jpeg',
    base64:   asset.base64,
  };
};

/** Opens the photo library. Includes GIFs — the system picker treats them as images. */
export const pickImageFromLibrary = async (): Promise<PickedImage | null> => {
  const res = await launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1, includeBase64: true});
  return fromResponse(res);
};

/** Opens the camera to take a new photo. */
export const pickImageFromCamera = async (): Promise<PickedImage | null> => {
  const res = await launchCamera({mediaType: 'photo', quality: 0.8, saveToPhotos: false, includeBase64: true});
  return fromResponse(res);
};

// ── Base64 → bytes (no atob dependency — not guaranteed present in Hermes) ──────

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const base64ToBytes = (base64: string): Uint8Array => {
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const len = clean.length;
  let byteLength = (len / 4) * 3;
  if (clean.endsWith('==')) byteLength -= 2;
  else if (clean.endsWith('=')) byteLength -= 1;

  const bytes = new Uint8Array(byteLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = BASE64_CHARS.indexOf(clean[i]);
    const e2 = BASE64_CHARS.indexOf(clean[i + 1]);
    const e3 = BASE64_CHARS.indexOf(clean[i + 2]);
    const e4 = BASE64_CHARS.indexOf(clean[i + 3]);

    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (e3 >= 0 && clean[i + 2] !== '=') bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (e4 >= 0 && clean[i + 3] !== '=') bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
};

/**
 * Uploads a picked image straight to the Firebase Storage REST API and
 * returns its public download URL. `folder` groups uploads (e.g.
 * 'chatImages', 'postImages', 'profilePhotos').
 */
export const uploadImage = async (image: PickedImage, folder: string): Promise<string> => {
  try {
    const path = `${folder}/${Date.now()}_${image.fileName}`.replace(/\s+/g, '_');
    const encodedPath = encodeURIComponent(path);
    const bytes = base64ToBytes(image.base64);

    const idToken = await auth.currentUser?.getIdToken();

    const uploadRes = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o?name=${encodedPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': image.type,
          ...(idToken ? {Authorization: `Firebase ${idToken}`} : {}),
        },
        body: bytes.buffer as ArrayBuffer,
      },
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => '');
      throw new Error(`Upload failed (${uploadRes.status}): ${errText || uploadRes.statusText}`);
    }

    const data = await uploadRes.json();
    const token = data.downloadTokens?.split(',')[0];
    return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media${token ? `&token=${token}` : ''}`;
  } catch (err: any) {
    console.error('[mediaService] uploadImage failed:', err?.code, err?.message, err);
    throw err;
  }
};

/**
 * Same "Take Photo / Choose from Library" prompt used everywhere an image
 * can be attached (profile photo, community post, support request, comment).
 * The chat composer uses its own AttachmentSheet grid instead, since it also
 * offers a Thank You Note option alongside the two photo sources.
 */
export const pickImageWithPrompt = (): Promise<PickedImage | null> =>
  new Promise(resolve => {
    Alert.alert('Add a Photo', undefined, [
      {text: 'Cancel', style: 'cancel', onPress: () => resolve(null)},
      {text: 'Take Photo', onPress: () => pickImageFromCamera().then(resolve)},
      {text: 'Choose from Library', onPress: () => pickImageFromLibrary().then(resolve)},
    ]);
  });
