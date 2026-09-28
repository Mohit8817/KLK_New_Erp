import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import authService, { type UserSession, type LoginResponse } from '../services/authService';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginUser: (email: string, pass: string, remember?: boolean) => Promise<LoginResponse>;
  loginVendor: (vendorId: string, pass: string, remember?: boolean) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  updateUserSession: (data: Partial<UserSession>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from sessionStorage or localStorage
  useEffect(() => {
    try {
      const activeSession = authService.getSession();
      if (activeSession) {
        setUser(activeSession);
      }
    } catch (err) {
      console.error('Session load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginUser = async (email: string, pass: string, remember: boolean = true): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const res = await authService.loginUser(email, pass);
      if (res.success && res.user) {
        setUser(res.user);
        authService.saveSession(res.user, remember);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const loginVendor = async (vendorId: string, pass: string, remember: boolean = true): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const res = await authService.loginVendor(vendorId, pass);
      if (res.success && res.user) {
        setUser(res.user);
        authService.saveSession(res.user, remember);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const updateUserSession = (data: Partial<UserSession>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    authService.saveSession(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginUser,
        loginVendor,
        logout,
        updateUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;
