import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { signInWithPopup } from 'firebase/auth';
import {
  auth as firebaseAuth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from './firebase';
import { API_BASE } from './apiBase';

export type User = {
  id: string;
  username: string;
  avatarId: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, avatarId?: string) => Promise<boolean>;
  loginWithOAuth: (providerName: 'google') => Promise<boolean>;
  registerWithOAuth: (providerName: 'google', avatarId?: string) => Promise<boolean>;
  logout: () => void;
  playAsGuest: () => void;
  updateAvatar: (avatarId: string) => Promise<boolean>;
  updateUsername: (username: string) => Promise<boolean>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('typinghero_token');
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch {
      // Offline or server down: keep existing session in memory for fallback
    } finally {
      setLoading(false);
    }
  };

  // ─── Email / Password Login (via Firebase) ────────────────────────────────
  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch(`${API_BASE}/api/auth/oauth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, provider: 'email' }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return false;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('typinghero_token', data.token);
      setLoading(false);
      return true;
    } catch (err: any) {
      const msg = firebaseErrorMessage(err.code);
      setError(msg);
      setLoading(false);
      return false;
    }
  };

  // ─── Email / Password Register (via Firebase) ─────────────────────────────
  const register = async (email: string, password: string, avatarId = 'knight'): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch(`${API_BASE}/api/auth/oauth-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, provider: 'email', avatarId }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return false;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('typinghero_token', data.token);
      setLoading(false);
      return true;
    } catch (err: any) {
      const msg = firebaseErrorMessage(err.code);
      setError(msg);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('typinghero_token');
    setLoading(false);
  };

  const updateAvatar = async (avatarId: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE}/api/auth/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarId }),
      });

      if (response.ok) {
        setUser((prev) => (prev ? { ...prev, avatarId } : null));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateUsername = async (username: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE}/api/auth/username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        setUser((prev) => (prev ? { ...prev, username } : null));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const loginWithOAuth = async (providerName: 'google'): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch(`${API_BASE}/api/auth/oauth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, provider: providerName }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'OAuth Login failed');
        setLoading(false);
        return false;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('typinghero_token', data.token);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('OAuth Login Error:', err);
      setError(err.message || 'OAuth Connection failed.');
      setLoading(false);
      return false;
    }
  };

  const registerWithOAuth = async (
    providerName: 'google',
    avatarId = 'knight'
  ): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch(`${API_BASE}/api/auth/oauth-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, provider: providerName, avatarId }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'OAuth Registration failed');
        setLoading(false);
        return false;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('typinghero_token', data.token);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('OAuth Registration Error:', err);
      setError(err.message || 'OAuth Connection failed.');
      setLoading(false);
      return false;
    }
  };

  const playAsGuest = () => {
    setError(null);
    setUser({
      id: `guest-${Math.random().toString(36).substring(2, 11)}`,
      username: `Guest Hero ${Math.floor(1000 + Math.random() * 9000)}`,
      avatarId: 'knight',
    });
    setToken(null);
    setLoading(false);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        loginWithOAuth,
        registerWithOAuth,
        logout,
        playAsGuest,
        updateAvatar,
        updateUsername,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ─── Firebase Error Code → Human-readable message ────────────────────────────
function firebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please log in.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please contact support.';
    default:
      return 'Authentication failed. Please try again.';
  }
}
