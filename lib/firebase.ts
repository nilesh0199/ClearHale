import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import { UserProfile, CityLocation, SupportedLanguage, HouseholdProfile } from '@/types';

export interface CloudProfilePayload {
  household: HouseholdProfile;
  language: SupportedLanguage;
  city: CityLocation;
  consentAt: string;
  consentVersion: string;
  updatedAt: string;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function getFirebaseInstance() {
  if (typeof window === 'undefined') return { app: null, auth: null, db: null };
  if (!isFirebaseConfigured()) return { app: null, auth: null, db: null };

  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth, db };
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  const { auth } = getFirebaseInstance();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Sign in with Google using popup, with seamless redirect fallback
 */
export async function signInWithGoogle(): Promise<{ user: User | null; error?: string }> {
  const { auth } = getFirebaseInstance();
  if (!auth) {
    return {
      user: null,
      error: 'Google Sign-in is not configured yet. Your profile is safely stored on this device.',
    };
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const cred = await signInWithPopup(auth, provider);
    return { user: cred.user };
  } catch (err: unknown) {
    const errCode = (err as { code?: string })?.code;
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn('[Firebase Auth] Popup error, checking fallback:', errCode, errMsg);

    // If popup was blocked by browser or mobile WebKit, fall back to redirect
    if (
      errCode === 'auth/popup-blocked' ||
      errCode === 'auth/cancelled-popup-request'
    ) {
      try {
        await signInWithRedirect(auth, provider);
        return { user: null };
      } catch (redirectErr: unknown) {
        return {
          user: null,
          error: 'Sign-in window was blocked. Please allow popups for this site.',
        };
      }
    }

    if (errCode === 'auth/popup-closed-by-user') {
      return {
        user: null,
        error: 'Sign-in was cancelled.',
      };
    }

    if (errCode === 'auth/network-request-failed') {
      return {
        user: null,
        error: 'Network error. Please check your connection and try again.',
      };
    }

    return {
      user: null,
      error: errMsg || 'Could not sign in with Google.',
    };
  }
}

/**
 * Check if returning from redirect sign-in
 */
export async function handleRedirectResult(): Promise<User | null> {
  const { auth } = getFirebaseInstance();
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (err) {
    console.warn('[Firebase Auth] Redirect result error:', err);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  const { auth } = getFirebaseInstance();
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Cloud Profile Storage (users/{uid}/profile ONLY)
 */
export async function saveProfileToCloud(
  uid: string,
  profile: UserProfile
): Promise<{ success: boolean; error?: string }> {
  const { db } = getFirebaseInstance();
  if (!db || !uid) {
    return { success: false, error: 'Database unavailable or user not signed in' };
  }

  const payload: CloudProfilePayload = {
    household: profile.household,
    language: profile.language,
    city: profile.city,
    consentAt: new Date().toISOString(),
    consentVersion: '1.0',
    updatedAt: new Date().toISOString(),
  };

  try {
    const profileRef = doc(db, 'users', uid, 'profile', 'data');
    await setDoc(profileRef, payload, { merge: true });
    return { success: true };
  } catch (err: unknown) {
    console.error('[Firebase Firestore] Failed to save profile:', err);
    const msg = err instanceof Error ? err.message : 'Failed to save to cloud';
    return { success: false, error: msg };
  }
}

export async function loadProfileFromCloud(
  uid: string
): Promise<CloudProfilePayload | null> {
  const { db } = getFirebaseInstance();
  if (!db || !uid) return null;

  try {
    const profileRef = doc(db, 'users', uid, 'profile', 'data');
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      return snap.data() as CloudProfilePayload;
    }
    return null;
  } catch (err) {
    console.error('[Firebase Firestore] Failed to load cloud profile:', err);
    return null;
  }
}

export async function deleteUserDataFromCloud(uid: string): Promise<boolean> {
  const { db, auth } = getFirebaseInstance();
  if (!db || !uid) return false;

  try {
    const profileRef = doc(db, 'users', uid, 'profile', 'data');
    await deleteDoc(profileRef);
    if (auth) {
      await signOut(auth);
    }
    return true;
  } catch (err) {
    console.error('[Firebase Firestore] Failed to delete user data:', err);
    return false;
  }
}
