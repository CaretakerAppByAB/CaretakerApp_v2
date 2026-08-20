/**
 * src/context/AuthContext.tsx
 * Updated: UserProfile now includes profile fields + profileComplete.
 * Added refreshUser() so ProfileSetupScreen can reload state after setup.
 */

import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {doc, setDoc, getDoc} from 'firebase/firestore';
import {auth, db} from '../config/firebase';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid:                  string;
  name:                 string;
  email:                string;
  handle:               string;
  pronouns:             string;
  age:                  string;
  profilePhotoURL:      string;
  coverPhotoURL:        string;
  goals:                string[];
  responsibilities:     string[];
  notificationsEnabled: boolean;
  profileComplete:      boolean;
}

interface AuthContextType {
  user:         UserProfile | null;
  isLoading:    boolean;
  login:        (email: string, password: string) => Promise<void>;
  register:     (name: string, email: string, password: string) => Promise<void>;
  logout:       () => Promise<void>;
  refreshUser:  () => Promise<void>;
}

// ── Default profile shape ──────────────────────────────────────────────────────

const defaultProfile = (uid: string, name: string, email: string): UserProfile => ({
  uid,
  name,
  email,
  handle:               '@' + name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') || 'user',
  pronouns:             '',
  age:                  '',
  profilePhotoURL:      '',
  coverPhotoURL:        '',
  goals:                [],
  responsibilities:     [],
  notificationsEnabled: false,
  profileComplete:      false,
});

// ── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user,      setUser]      = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string): Promise<UserProfile | null> => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? (snap.data() as UserProfile) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        const profile = await loadProfile(firebaseUser.uid);
        setUser(profile ?? defaultProfile(
          firebaseUser.uid,
          firebaseUser.email?.split('@')[0] ?? 'User',
          firebaseUser.email ?? '',
        ));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const register = async (name: string, email: string, password: string) => {
    const cred    = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const profile = defaultProfile(cred.user.uid, name.trim(), email.trim().toLowerCase());
    await setDoc(doc(db, 'users', cred.user.uid), profile);
  };

  const logout = async () => {
    await signOut(auth);
  };

  /** Call after completing profile setup to reload state without waiting for onAuthStateChanged */
  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return;
    const profile = await loadProfile(auth.currentUser.uid);
    if (profile) setUser(profile);
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{user, isLoading, login, register, logout, refreshUser}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
