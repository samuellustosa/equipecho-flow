import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Tipo de dados para um aviso
export type Announcement = Tables<'announcements'>;

// Hook para buscar todos os avisos para o administrador
export const useAnnouncements = () => {
  return useQuery<Announcement[], Error>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data as Announcement[];
    },
  });
};

// Hook para buscar apenas os avisos ativos para os usuários
export const useActiveAnnouncements = () => {
  return useQuery<Announcement[], Error>({
    queryKey: ['activeAnnouncements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data as Announcement[];
    },
  });
};

// Hook para criar um novo aviso
export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation<Announcement, Error, Omit<Announcement, 'id' | 'created_at' | 'updated_at'>>({
    mutationFn: async (newAnnouncement) => {
      const { data, error } = await supabase.from('announcements').insert(newAnnouncement).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['activeAnnouncements'] });
    },
  });
};

// Hook para atualizar um aviso
export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation<Announcement, Error, Partial<Announcement> & { id: string }>({
    mutationFn: async ({ id, ...updatedAnnouncement }) => {
      const { data, error } = await supabase.from('announcements').update(updatedAnnouncement).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['activeAnnouncements'] });
    },
  });
};

// Hook para deletar um aviso
export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['activeAnnouncements'] });
    },
  });
};