/**
 * src/context/AuthContext.tsx  — complete rewrite with Firebase Auth
 *
 * Replace your existing file with this one.
 * The public API (useAuth, AuthProvider) is unchanged so no other
 * files need updating EXCEPT App.tsx (see App.tsx in this set).
 */

import React, {createContext, useContext, useState, useEffect} from 'react';
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
  uid:    string;
  name:   string;
  email:  string;
  handle: string;
}

interface AuthContextType {
  user:      UserProfile | null;
  isLoading: boolean;
  login:     (email: string, password: string) => Promise<void>;
  register:  (name: string, email: string, password: string) => Promise<void>;
  logout:    () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user,      setUser]      = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // onAuthStateChanged fires once on mount (to restore a persisted session)
  // and again whenever the user signs in or out.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            setUser(snap.data() as UserProfile);
          } else {
            // Fallback — should not normally happen
            setUser({
              uid:    firebaseUser.uid,
              name:   firebaseUser.email?.split('@')[0] ?? 'User',
              email:  firebaseUser.email ?? '',
              handle: '@' + (firebaseUser.email?.split('@')[0] ?? 'user'),
            });
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Auth actions ─────────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
    // onAuthStateChanged handles updating the user state
  };

  const register = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const handle =
      '@' +
      name.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const profile: UserProfile = {
      uid:    cred.user.uid,
      name:   name.trim(),
      email:  email.trim().toLowerCase(),
      handle: handle || '@user',
    };
    // Save the profile to Firestore so others can look the user up
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    // onAuthStateChanged fires and sets the user state automatically
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{user, isLoading, login, register, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
