import { type User } from 'firebase/auth';

/**
 * 開発用モックユーザー
 * Firebase未設定時に自動ログインされる
 */
const MOCK_USER = {
  uid: 'dev-user-001',
  email: 'dev@localhost',
  displayName: 'Dev User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  providerData: [],
  refreshToken: '',
  tenantId: null,
  phoneNumber: null,
  providerId: 'google.com',
  metadata: {},
  delete: async () => {},
  getIdToken: async () => 'mock-token',
  getIdTokenResult: async () => ({}) as ReturnType<User['getIdTokenResult']>,
  reload: async () => {},
  toJSON: () => ({ uid: 'dev-user-001', email: 'dev@localhost' }),
} as unknown as User;

let authCallback: ((user: User | null) => void) | null = null;

export async function signInWithGoogle(): Promise<User> {
  if (authCallback) authCallback(MOCK_USER);
  return MOCK_USER;
}

export async function signOut(): Promise<void> {
  if (authCallback) authCallback(null);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  authCallback = callback;

  if (typeof window === 'undefined') {
    // SSR/ビルド時: ユーザーなし
    callback(null);
    return () => {};
  }

  // クライアント: 開発モードで自動ログイン
  setTimeout(() => callback(MOCK_USER), 0);

  return () => {
    authCallback = null;
  };
}
