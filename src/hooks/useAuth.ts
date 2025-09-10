import { useState, useContext, createContext, useEffect, useRef, useCallback, ReactNode } from 'react';
import { supabase, TEST_SESSION_TIMEOUT } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// Define a URL base dinamicamente.
const BASE_URL = window.location.origin;

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user' | 'pending';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  low_stock_alerts_enabled?: boolean;
  overdue_maintenance_alerts_enabled?: boolean;
  read_notification_ids?: string[];
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPending: boolean;
}

// Auth Context
export const AuthContext = createContext<{
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  setAuthUser: (updates: Partial<User>) => void;
  resetPassword: (email: string) => Promise<void>;
  useUpdateUserNotifications: () => ReturnType<typeof useMutation>;
} | null>(null);

// Hook para atualizar notificações lidas
export const useUpdateUserNotifications = () => {
  const queryClient = useQueryClient();
  const { authState, setAuthUser } = useAuth();

  return useMutation({
    mutationFn: async (readNotificationIds: string[]) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ read_notification_ids: readNotificationIds })
        .eq('id', authState.user?.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (updatedProfile) => {
      if (updatedProfile) {
        setAuthUser({ read_notification_ids: updatedProfile.read_notification_ids });
      }
    },
  });
};

// O gancho que contém a lógica do provedor.
export const useAuthProvider = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isPending: false,
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const testTimerRef = useRef<number | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`*, read_notification_ids, low_stock_alerts_enabled, overdue_maintenance_alerts_enabled`)
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        setAuthState((prev) => ({
          ...prev,
          user: profile as User,
          isPending: profile.role === 'pending',
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthState({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      isPending: false,
    });
    queryClient.clear();
    navigate('/auth', { replace: true });
  }, [navigate, queryClient]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState((prev) => ({
          ...prev,
          session,
          isAuthenticated: !!session,
          isLoading: false,
        }));

        if (session?.user) {
          fetchUserProfile(session.user.id);
          
          if (TEST_SESSION_TIMEOUT) {
            if (testTimerRef.current) {
              clearTimeout(testTimerRef.current);
            }

            testTimerRef.current = window.setTimeout(() => {
              console.log('Sessão expirada por timer de teste');
              logout();
            }, TEST_SESSION_TIMEOUT);
          }
        } else {
          if (testTimerRef.current) {
            clearTimeout(testTimerRef.current);
            testTimerRef.current = null;
          }
          setAuthState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            isPending: false,
          });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          isPending: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
      if (testTimerRef.current) {
        clearTimeout(testTimerRef.current);
      }
    };
  }, [logout, queryClient]);

  const login = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isPending: false,
      });
      throw new Error(error.message || 'Credenciais inválidas');
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${BASE_URL}/auth/callback`,
          data: { name },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isPending: false,
      });
      throw new Error(error.message || 'Erro ao criar conta');
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${BASE_URL}/auth/update-password`,
    });
    if (error) throw new Error(error.message);
  };

  const setAuthUser = (updates: Partial<User>) => {
    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : prev.user,
    }));
  };

  const value = {
    authState,
    login,
    signUp,
    logout,
    setAuthUser,
    resetPassword,
    useUpdateUserNotifications,
  };

  return value;
};

// O gancho para consumir o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};