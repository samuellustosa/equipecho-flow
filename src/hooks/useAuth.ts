import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';

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
  logout: () => void;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  setAuthUser: (updates: Partial<User>) => void;
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
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isPending: false,
  });
  
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`*, read_notification_ids, low_stock_alerts_enabled, overdue_maintenance_alerts_enabled`)
        .eq('id', userId)
        .single();
        
      if (error) {
          throw error;
      }
      
      if (profile) {
        setAuthState(prev => ({
          ...prev,
          user: profile as User,
          isPending: profile.role === 'pending'
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        
        setAuthState(prev => ({
          ...prev,
          session,
          isAuthenticated: !!session,
          isLoading: false
        }));
        
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setAuthState(prev => ({
            ...prev,
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            isPending: false,
          }));
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

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }
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
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name
          }
        }
      });

      if (error) {
        throw error;
      }
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

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const setAuthUser = (updates: Partial<User>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : prev.user,
    }));
  };

  return {
    authState,
    login,
    signUp,
    logout,
    setAuthUser
  };
};

export const useUpdateUserNotifications = () => {
  const queryClient = useQueryClient();
  const { authState, setAuthUser } = useAuth();

  return useMutation({
    mutationFn: async (readAlertIds: string[]) => {
      if (!authState.user) throw new Error('User not authenticated');
      
      const currentReadIds = authState.user.read_notification_ids || [];
      const newReadIds = [...new Set([...currentReadIds, ...readAlertIds])];
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ read_notification_ids: newReadIds })
        .eq('id', authState.user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setAuthUser({ read_notification_ids: data.read_notification_ids as string[] });
      queryClient.invalidateQueries({ queryKey: ['equipmentAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar notificações",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};