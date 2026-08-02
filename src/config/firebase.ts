/**
 * src/config/firebase.ts
 *
 * This file connects your app to Firebase (Google's cloud database).
 * You need to fill in the config values below with YOUR project's values.
 *
 * HOW TO GET YOUR CONFIG VALUES:
 * 1. Go to https://console.firebase.google.com
 * 2. Click your project (or create one — see SETUP.md)
 * 3. Click the gear icon ⚙️ → Project Settings
 * 4. Scroll down to "Your apps" → click your web app (</>)
 * 5. Copy each value from the firebaseConfig object shown there
 * 6. Paste them into the fields below, replacing each "PASTE_..." placeholder
 */

import {initializeApp, getApps, getApp} from 'firebase/app';
import {initializeFirestore}             from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA91dfG84uVDpbIhpCUOMxyyAXvz8O4-r4",
  authDomain: "alzapp-f3f03.firebaseapp.com",
  projectId: "alzapp-f3f03",
  storageBucket: "alzapp-f3f03.firebasestorage.app",
  messagingSenderId: "852333578682",
  appId: "1:852333578682:web:da1fd3f11630b71aa97583",
  measurementId: "G-SDENDJ8M0V"
};


// This guard prevents "Firebase already initialized" crashes
// when React Native's hot-reload re-runs this file
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// experimentalForceLongPolling: true is REQUIRED for React Native.
// Without it, Firestore tries to use WebSocket which doesn't work reliably
// in React Native — this switches it to plain HTTP, which always works.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
