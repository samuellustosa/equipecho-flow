import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Location = {
  id: string;
  name: string;
  created_at: string;
};

// Hook para buscar todas as localizações
export const useLocations = () => {
  return useQuery<Location[], Error>({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('*').order('name');
      if (error) throw new Error(error.message);
      return data as Location[];
    },
  });
};

// Hook para criar uma nova localização
export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation<Location, Error, { name: string }>({
    mutationFn: async ({ name }) => {
      const { data, error } = await supabase.from('locations').insert({ name }).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};

// Hook para deletar uma localização
export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};