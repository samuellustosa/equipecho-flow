import { useState, useEffect, createContext, useContext } from 'react';

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'User';
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Mock authentication for demo - replace with Supabase
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@equipecho.com',
    name: 'João Silva',
    role: 'Admin',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'manager@equipecho.com',
    name: 'Maria Santos',
    role: 'Manager',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    email: 'user@equipecho.com',
    name: 'Carlos Lima',
    role: 'User',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Auth Context
const AuthContext = createContext<{
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
} | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('equipecho_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true
          });
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Mock login - replace with Supabase auth
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = mockUsers.find(u => u.email === email);
      if (!user || password !== 'password') {
        throw new Error('Credenciais inválidas');
      }

      localStorage.setItem('equipecho_user', JSON.stringify(user));
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true
      });
    } catch (error) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('equipecho_user');
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false
    });
  };

  return {
    authState,
    login,
    logout
  };
};

export { AuthContext };