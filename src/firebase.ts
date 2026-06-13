// Instruksi Pemasangan Firebase Configuration:
// 1. Buat project baru di Firebase Console (https://console.firebase.google.com/)
// 2. Aktifkan layanan Firestore Database dan Storage (di menu Build)
// 3. Daftarkan aplikasi Web di Project Settings
// 4. Copy konfigurasi "firebaseConfig" dan timpa objek di bawah ini.
// 5. Pastikan Anda mengatur Security Rules Storage dan Firestore agar bisa Read/Write di tahap development.
//    Contoh rule development: `allow read, write: if true;` (JANGAN GUNAKAN DI PRODUCTION)

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, User, signInWithPopup } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Handle potential default wrapping in config
const getFirebaseConfig = () => {
  const cfg = firebaseConfig as any;
  if (cfg && cfg.default) {
    return cfg.default;
  }
  return cfg;
};

const finalConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(finalConfig);

// Initialize Cloud Firestore and Cloud Storage
export const db = getFirestore(app, finalConfig.firestoreDatabaseId || "ai-studio-40528eed-0559-4c22-b7a5-6fd23c02df7c");
export const storage = getStorage(app);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
const KEY_ACCESS_TOKEN = 'drive_access_token';

export const initAuth = (
  onAuthSuccess?: (user: User) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user);
    } else {
      sessionStorage.removeItem(KEY_ACCESS_TOKEN);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    sessionStorage.setItem(KEY_ACCESS_TOKEN, credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return sessionStorage.getItem(KEY_ACCESS_TOKEN);
};

export const logout = async () => {
  await auth.signOut();
  sessionStorage.removeItem(KEY_ACCESS_TOKEN);
};

