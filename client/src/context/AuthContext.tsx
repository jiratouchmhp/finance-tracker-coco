import { createContext, useContext, useState, useEffect, type ReactNode, JSX } from 'react';
import type { User } from '@coco/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('coco_token');
    const savedUser = localStorage.getItem('coco_user');
    if (saved && savedUser) {
      setToken(saved);
      try {
        setUser(JSON.parse(savedUser) as User);
      } catch {
        localStorage.removeItem('coco_token');
        localStorage.removeItem('coco_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User): void => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('coco_token', newToken);
    localStorage.setItem('coco_user', JSON.stringify(newUser));
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('coco_token');
    localStorage.removeItem('coco_user');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
