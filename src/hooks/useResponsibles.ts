import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Responsible {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  sector_id?: string;
  created_at: string;
  updated_at: string;
  sectors?: {
    name: string;
  };
}

export const useResponsibles = () => {
  return useQuery({
    queryKey: ['responsibles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('responsibles')
        .select(`
          *,
          sectors (name)
        `)
        .order('name');

      if (error) throw error;
      return data as Responsible[];
    }
  });
};

export const useCreateResponsible = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (responsible: Omit<Responsible, 'id' | 'created_at' | 'updated_at' | 'sectors'>) => {
      const { data, error } = await supabase
        .from('responsibles')
        .insert(responsible)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibles'] });
    }
  });
};

export const useUpdateResponsible = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...responsible }: Partial<Responsible> & { id: string }) => {
      const { data, error } = await supabase
        .from('responsibles')
        .update(responsible)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibles'] });
    }
  });
};

export const useDeleteResponsible = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('responsibles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibles'] });
    }
  });
};