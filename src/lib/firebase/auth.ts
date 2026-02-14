import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

/**
 * Google アカウントでサインイン
 */
export async function signInWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * サインアウト
 */
export async function signOut(): Promise<void> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  await firebaseSignOut(auth);
}

/**
 * 認証状態の変更を監視
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    // Firebase未初期化時（ビルド時等）はno-op
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
