import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export interface Maintenance {
  id: string;
  equipment_id: string;
  performed_by_id?: string | null;
  service_type: Tables<'maintenances'>['service_type'];
  description?: string | null;
  cost?: number | null;
  performed_at: string;
  created_at: string;
  updated_at: string;
  responsibles?: {
    name: string;
  };
}

// Hook para buscar o histórico de manutenção de um equipamento específico
export const useMaintenanceHistory = (equipmentId: string) => {
  return useQuery({
    queryKey: ['maintenances', equipmentId],
    queryFn: async () => {
      if (!equipmentId) return [];

      const { data, error } = await supabase
        .from('maintenances')
        .select(`
          *,
          responsibles (name)
        `)
        .eq('equipment_id', equipmentId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return data as Maintenance[];
    }
  });
};

// Hook para criar um novo registro de manutenção
export const useCreateMaintenance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (maintenance: Omit<Maintenance, 'id' | 'created_at' | 'updated_at' | 'responsibles'>) => {
      const { data, error } = await supabase
        .from('maintenances')
        .insert(maintenance)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newMaintenance) => {
      queryClient.invalidateQueries({ queryKey: ['maintenances', newMaintenance.equipment_id] });
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      // Adicione aqui a invalidação de outros hooks se necessário, como useEquipmentAlerts
    }
  });
};

// Hook para deletar um registro de manutenção
export const useDeleteMaintenance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('maintenances')
        .delete()
        .eq('id', id)
        .select('equipment_id')
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (deletedMaintenance) => {
      queryClient.invalidateQueries({ queryKey: ['maintenances', deletedMaintenance.equipment_id] });
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
    }
  });
};