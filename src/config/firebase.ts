/**
 * src/config/firebase.ts  — replace your existing file with this one
 *
 * Changes from previous version:
 *  - Added Firebase Auth with AsyncStorage persistence
 *    (users stay logged in after closing the app)
 */

import {getApps, initializeApp} from 'firebase/app';
import {getFirestore, initializeFirestore} from 'firebase/firestore';
import {initializeAuth, getAuth, getReactNativePersistence} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ▼ YOUR CONFIG — same values you already pasted for the community forum ▼
const firebaseConfig = {
  apiKey: "AIzaSyA91dfG84uVDpbIhpCUOMxyyAXvz8O4-r4",
  authDomain: "alzapp-f3f03.firebaseapp.com",
  projectId: "alzapp-f3f03",
  storageBucket: "alzapp-f3f03.firebasestorage.app",
  messagingSenderId: "852333578682",
  appId: "1:852333578682:web:da1fd3f11630b71aa97583",
  measurementId: "G-SDENDJ8M0V"
};

// ▲ YOUR CONFIG ▲

// Guard against double-initialisation during hot reload
if (!getApps().length) {
  const app = initializeApp(firebaseConfig);

  // experimentalForceLongPolling required for React Native
  initializeFirestore(app, {experimentalForceLongPolling: true});

  // getReactNativePersistence keeps the user logged in across app restarts
  initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

const app = getApps()[0];

export const db   = getFirestore(app);
export const auth = getAuth(app);
