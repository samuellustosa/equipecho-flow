import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

export type AuditLog = Tables<'audit_logs'> & {
  profiles: {
    name: string;
    email: string;
  } | null;
};

// Adiciona os parâmetros de paginação `page` e `limit`
export const useAuditLogs = (page: number, limit: number) => {
  const { authState } = useAuth();
  const isAdmin = authState.user?.role === 'admin';

  return useQuery<{ logs: AuditLog[], totalCount: number }, Error>({
    // Inclui a página e o limite na queryKey para que a query seja refeita quando esses valores mudarem
    queryKey: ['auditLogs', page, limit], 
    queryFn: async () => {
      if (!isAdmin) {
        return { logs: [], totalCount: 0 };
      }

      const from = (page - 1) * limit;
      const to = page * limit - 1;

      // Consulta otimizada com contagem total e range
      const { data, error, count } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles (name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);

      return { logs: data as AuditLog[], totalCount: count || 0 };
    },
    enabled: isAdmin,
    // Garante que o estado de paginação inicial seja passado para o `useQuery`
    placeholderData: (previousData) => previousData,
  });
};