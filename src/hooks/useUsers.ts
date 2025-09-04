import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'pending';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  low_stock_alerts_enabled: boolean;
  overdue_maintenance_alerts_enabled: boolean;
}

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    }
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { authState } = useAuth();
  
  return useMutation({
    mutationFn: async (userData: { email: string; password: string; name: string; role: 'admin' | 'manager' | 'user' }) => {
      const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
      
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;
      
      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro desconhecido');
      }

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...userData }: Partial<UserProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { authState } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`;
      
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;
      
      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro desconhecido');
      }
      
      if (responseData.error) {
        throw new Error(responseData.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};