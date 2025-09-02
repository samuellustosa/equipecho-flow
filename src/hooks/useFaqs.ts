import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FaqItem } from '@/pages/Faqs';

// Hook para buscar todas as FAQs com paginação
export const useFaqs = (limit: number = 10, offset: number = 0) => {
  return useQuery<FaqItem[], Error>({
    queryKey: ['faqs', { limit, offset }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('created_at')
        .range(offset, offset + limit - 1);
        
      if (error) throw new Error(error.message);
      return data as FaqItem[];
    },
  });
};

// Hook para buscar a contagem total de FAQs (necessário para a paginação)
export const useFaqsCount = () => {
  return useQuery<number, Error>({
    queryKey: ['faqsCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('faqs')
        .select('*', { count: 'exact', head: true });

      if (error) throw new Error(error.message);
      return count as number;
    },
  });
};

// Hook para criar uma nova FAQ
export const useCreateFaq = () => {
  const queryClient = useQueryClient();
  return useMutation<FaqItem, Error, Omit<FaqItem, 'id'>>({
    mutationFn: async (newFaq) => {
      const { data, error } = await supabase.from('faqs').insert(newFaq).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faqsCount'] });
    },
  });
};

// Hook para atualizar uma FAQ
export const useUpdateFaq = () => {
  const queryClient = useQueryClient();
  return useMutation<FaqItem, Error, Partial<FaqItem> & { id: string }
  >({
    mutationFn: async ({ id, ...updatedFaq }) => {
      const { data, error } = await supabase.from('faqs').update(updatedFaq).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });
};

// Hook para deletar uma FAQ
export const useDeleteFaq = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faqsCount'] });
    },
  });
};