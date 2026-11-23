'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  subscribeToAuth,
  signInWithGoogle,
  signOutUser,
  saveProfileToCloud,
  loadProfileFromCloud,
  deleteUserDataFromCloud,
  isFirebaseConfigured,
  handleRedirectResult,
  CloudProfilePayload,
} from '@/lib/firebase';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  signIn: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  saveCloudProfile: (profile: UserProfile) => Promise<{ success: boolean; error?: string }>;
  loadCloudProfile: () => Promise<CloudProfilePayload | null>;
  deleteCloudAccount: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = isFirebaseConfigured();

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Handle redirect result if user was redirected back
    handleRedirectResult()
      .then((u) => {
        if (u) setUser(u);
      })
      .catch((err) => {
        console.warn('Redirect sign-in error:', err);
      });

    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const clearError = useCallback(() => setError(null), []);

  const signIn = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return { success: false, error: res.error };
      }
      if (res.user) {
        setUser(res.user);
      }
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Sign in failed';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (err: any) {
      setError(err?.message || 'Sign out failed');
    }
  }, []);

  const saveCloud = useCallback(
    async (profile: UserProfile) => {
      if (!user) return { success: false, error: 'Not signed in' };
      return saveProfileToCloud(user.uid, profile);
    },
    [user]
  );

  const loadCloud = useCallback(async () => {
    if (!user) return null;
    return loadProfileFromCloud(user.uid);
  }, [user]);

  const deleteCloud = useCallback(async () => {
    if (!user) return false;
    const ok = await deleteUserDataFromCloud(user.uid);
    if (ok) {
      setUser(null);
    }
    return ok;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isConfigured,
        signIn,
        signOut,
        saveCloudProfile: saveCloud,
        loadCloudProfile: loadCloud,
        deleteCloudAccount: deleteCloud,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
