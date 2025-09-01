import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Category = {
  id: string;
  name: string;
  created_at: string;
};

// Hook para buscar todas as categorias
export const useCategories = () => {
  return useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw new Error(error.message);
      return data as Category[];
    },
  });
};

// Hook para criar uma nova categoria
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, { name: string }>({
    mutationFn: async ({ name }) => {
      const { data, error } = await supabase.from('categories').insert({ name }).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// Hook para deletar uma categoria
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};