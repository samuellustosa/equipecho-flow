import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

// O tipo foi alterado de `interface` para `type` para resolver o erro.
export type AuditLog = Tables<'audit_logs'> & {
  profiles: {
    name: string;
    email: string;
  } | null;
};

export const useAuditLogs = () => {
  const { authState } = useAuth();
  const isAdmin = authState.user?.role === 'admin';

  return useQuery<AuditLog[], Error>({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      // Retorna uma lista vazia se o usuário não for admin
      if (!isAdmin) {
        return [];
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data as AuditLog[];
    },
    enabled: isAdmin,
  });
};