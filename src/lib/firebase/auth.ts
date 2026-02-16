import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './config';
import * as mockAuth from '@/lib/mock/auth';

const googleProvider = new GoogleAuthProvider();

/**
 * Firebase未設定かつブラウザ環境 → モックモード
 */
function useMock(): boolean {
  return !auth && typeof window !== 'undefined';
}

/**
 * Google アカウントでサインイン
 */
export async function signInWithGoogle(): Promise<User> {
  if (useMock()) return mockAuth.signInWithGoogle();
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * サインアウト
 */
export async function signOut(): Promise<void> {
  if (useMock()) return mockAuth.signOut();
  if (!auth) throw new Error('Firebase Auth is not initialized');
  await firebaseSignOut(auth);
}

/**
 * 認証状態の変更を監視
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (useMock()) return mockAuth.onAuthChange(callback);
  if (!auth) {
    // Firebase未初期化 & SSR/ビルド時 → no-op
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
