/**
 * src/services/mediaService.ts
 *
 * Shared image picking + Firebase Storage upload helpers used by chat
 * attachments, community posts/comments, and profile pictures.
 */

import {Alert} from 'react-native';
import {launchCamera, launchImageLibrary, ImagePickerResponse} from 'react-native-image-picker';
import {ref, uploadString, getDownloadURL} from 'firebase/storage';
import {storage} from '../config/firebase';

export interface PickedImage {
  uri:      string;
  fileName: string;
  type:     string;
}

const fromResponse = (res: ImagePickerResponse): PickedImage | null => {
  if (res.didCancel || res.errorCode || !res.assets?.length) return null;
  const asset = res.assets[0];
  if (!asset.uri) return null;
  return {
    uri:      asset.uri,
    fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
    type:     asset.type ?? 'image/jpeg',
  };
};

/** Opens the photo library. Includes GIFs — the system picker treats them as images. */
export const pickImageFromLibrary = async (): Promise<PickedImage | null> => {
  const res = await launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1});
  return fromResponse(res);
};

/** Opens the camera to take a new photo. */
export const pickImageFromCamera = async (): Promise<PickedImage | null> => {
  const res = await launchCamera({mediaType: 'photo', quality: 0.8, saveToPhotos: false});
  return fromResponse(res);
};

/**
 * Reads a local file URI into a base64 string via a Blob + FileReader.
 * (`uploadBytes` with a React Native fetch()-produced Blob reliably fails
 * with "Firebase Storage: An unknown error occurred" — RN's Blob doesn't
 * behave the way the Firebase JS SDK's XHR-based uploader expects. Reading
 * it to base64 and using `uploadString` is the documented workaround.)
 */
const uriToBase64 = async (uri: string): Promise<string> => {
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:<mime>;base64," prefix — uploadString wants raw base64.
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });
};

/**
 * Uploads a picked image to Firebase Storage and returns its public download URL.
 * `folder` groups uploads (e.g. 'chatImages', 'postImages', 'profilePhotos').
 */
export const uploadImage = async (image: PickedImage, folder: string): Promise<string> => {
  try {
    const base64 = await uriToBase64(image.uri);
    const path = `${folder}/${Date.now()}_${image.fileName}`.replace(/\s+/g, '_');
    const storageRef = ref(storage, path);
    await uploadString(storageRef, base64, 'base64', {contentType: image.type});
    return await getDownloadURL(storageRef);
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
