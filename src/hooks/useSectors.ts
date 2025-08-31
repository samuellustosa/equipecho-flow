import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Sector {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useSectors = () => {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Sector[];
    }
  });
};

export const useCreateSector = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sector: Omit<Sector, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('sectors')
        .insert(sector)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
    }
  });
};

export const useUpdateSector = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...sector }: Partial<Sector> & { id: string }) => {
      const { data, error } = await supabase
        .from('sectors')
        .update(sector)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
    }
  });
};

export const useDeleteSector = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sectors')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
    }
  });
};