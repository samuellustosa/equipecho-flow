import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export const useEquipments = () => {
  return useQuery({
    queryKey: ['equipments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipments')
        .select(`
          *,
          sectors (name),
          responsibles (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Equipment[];
    }
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
      queryClient.invalidateQueries({ queryKey: ['equipmentAlerts'] }); //
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
      queryClient.invalidateQueries({ queryKey: ['equipmentAlerts'] }); //
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
      queryClient.invalidateQueries({ queryKey: ['equipmentAlerts'] }); //
    }
  });
};