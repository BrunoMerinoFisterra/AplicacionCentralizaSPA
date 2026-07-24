import { Preferences } from '@capacitor/preferences';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../lib/api';

type LoginData = {
  username: string;
  password: string;
};

type AuthUser = {
  token: string;
  username: string;
  role: string;
  fullName?: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'centraliza_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const { value } = await Preferences.get({ key: AUTH_STORAGE_KEY });
      if (value) {
        setUser(JSON.parse(value));
      }
    } catch (error) {
      console.error('Error restoring session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async ({ username, password }: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalized = {
        username: username.trim(),
        password: password.trim(),
      };

      if (!normalized.username || !normalized.password) {
        return { success: false, error: 'Completá todos los campos.' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Credenciales inválidas.' };
      }

      const authUser: AuthUser = {
        token: data.token,
        username: data.user.username,
        role: data.user.role,
        fullName: data.user.fullName ?? null,
      };

      await Preferences.set({ key: AUTH_STORAGE_KEY, value: JSON.stringify(authUser) });
      setUser(authUser);

      return { success: true };
    } catch (error) {
      console.error('Error signing in:', error);
      return { success: false, error: 'No se pudo iniciar sesión.' };
    }
  };

  const signOut = async () => {
    try {
      await Preferences.remove({ key: AUTH_STORAGE_KEY });
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
