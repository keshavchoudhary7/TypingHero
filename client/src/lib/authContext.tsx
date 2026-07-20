import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth as firebaseAuth, googleProvider } from './firebase';

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
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, avatarId?: string) => Promise<boolean>;
  loginWithOAuth: (providerName: 'google') => Promise<boolean>;
  registerWithOAuth: (providerName: 'google', avatarId?: string) => Promise<boolean>;
  logout: () => void;
  updateAvatar: (avatarId: string) => Promise<boolean>;
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
      const response = await fetch('http://localhost:4000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          // Token invalid or expired
          logout();
        }
      } else {
        logout();
      }
    } catch {
      // Offline or server down: keep existing session in memory for fallback, but stop loading
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
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
    } catch {
      setError('Server connection unavailable.');
      setLoading(false);
      return false;
    }
  };

  const register = async (username: string, password: string, avatarId = 'knight'): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, avatarId }),
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
    } catch {
      setError('Server connection unavailable.');
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
      const response = await fetch('http://localhost:4000/api/auth/avatar', {
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

  const loginWithOAuth = async (providerName: 'google'): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch('http://localhost:4000/api/auth/oauth-login', {
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

      const response = await fetch('http://localhost:4000/api/auth/oauth-register', {
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
        updateAvatar,
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
