/**
 * AlzApp — Auth Context (SKELETON)
 *
 * DEVELOPER NOTE:
 * This is a placeholder authentication system.
 * Any email + password combination will log a user in.
 * Replace login() and register() with real API calls to your backend.
 * The User object shape should stay the same so the rest of the app works.
 */

import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{success: boolean; error?: string}>;
  register: (name: string, email: string, password: string) => Promise<{success: boolean; error?: string}>;
  logout: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const stored = await AsyncStorage.getItem('@alz_session');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // No session found — user will need to log in
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * TODO (Backend Team):
   * Replace this with a real POST /auth/login API call.
   * Return success: false with an error message if credentials are invalid.
   * On success, store the real JWT token and user profile.
   *
   * SKELETON BEHAVIOUR: Any email + password logs the user in.
   */
  const login = async (
    email: string,
    password: string,
  ): Promise<{success: boolean; error?: string}> => {
    if (!email.trim() || !password) {
      return {success: false, error: 'Please enter your email and password.'};
    }

    // SKELETON: Create a mock user from whatever was typed
    const mockUser: User = {
      id: `user_${Date.now()}`,
      name: email.split('@')[0],        // e.g. "jane" from "jane@hospital.org"
      email: email.trim().toLowerCase(),
    };

    setUser(mockUser);
    await AsyncStorage.setItem('@alz_session', JSON.stringify(mockUser));
    return {success: true};
  };

  /**
   * TODO (Backend Team):
   * Replace this with a real POST /auth/register API call.
   * Validate uniqueness of email on the server side.
   *
   * SKELETON BEHAVIOUR: Any name/email/password creates an account.
   */
  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<{success: boolean; error?: string}> => {
    if (!name.trim() || !email.trim() || !password) {
      return {success: false, error: 'Please fill in all fields.'};
    }

    // SKELETON: Create a mock user from whatever was typed
    const mockUser: User = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
    };

    setUser(mockUser);
    await AsyncStorage.setItem('@alz_session', JSON.stringify(mockUser));
    return {success: true};
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@alz_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{user, isLoading, login, register, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};
