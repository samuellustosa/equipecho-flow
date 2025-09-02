import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Equipment {
  id: string;
  name: string;
  model?: string;
  serial_number?: string;
  sector_id?: string;
  responsible_id?: string;
  status: 'operacional' | 'manutencao' | 'parado';
  last_cleaning?: string;
  next_cleaning: string;
  cleaning_frequency_days: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  sectors?: {
    name: string;
  };
  responsibles?: {
    name: string;
  };
}

// Modificado para suportar paginação
export const useEquipments = (limit: number = 10, offset: number = 0) => {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['equipments', { limit, offset }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipments')
        .select(`
          *,
          sectors (name),
          responsibles (name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1); // Aplicando a paginação

      if (error) throw error;
      return data as Equipment[];
    },
    enabled: !!authState.user, // A consulta só é ativada se houver um utilizador logado
  });
};

// NOVO: Hook para obter a contagem total de equipamentos
export const useEquipmentsCount = () => {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['equipmentsCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('equipments')
        .select('*', { count: 'exact', head: true });
        
      if (error) throw error;
      return count as number;
    },
    enabled: !!authState.user, // A consulta só é ativada se houver um utilizador logado
  });
};

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (equipment: Omit<Equipment, 'id' | 'created_at' | 'updated_at' | 'sectors' | 'responsibles'>) => {
      const { data, error } = await supabase
        .from('equipments')
        .insert(equipment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      queryClient.invalidateQueries({ queryKey: ['equipmentsCount'] });
      queryClient.invalidateQueries({ queryKey: ['equipmentAlerts'] });
    }
  });
};

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...equipment }: Partial<Equipment> & { id: string }) => {
      const { data, error } = await supabase
        .from('equipments')
        .update(equipment)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      queryClient.invalidateQueries({ queryKey: ['equipmentAlerts'] });
    }
  });
};

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      queryClient.invalidateQueries({ queryKey: ['equipmentsCount'] });
      queryClient.invalidateQueries({ queryKey: ['equipmentAlerts'] });
    }
  });
};