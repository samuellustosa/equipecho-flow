import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays, differenceInMinutes, parseISO } from 'date-fns';
import { Maintenance } from './useMaintenances';

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

// Hook para buscar TODOS os equipamentos
export const useAllEquipments = () => {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['allEquipments'],
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
    },
    enabled: !!authState.user,
  });
};

// Hook para buscar equipamentos com paginação
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
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data as Equipment[];
    },
    enabled: !!authState.user,
  });
};

// Hook para obter a contagem total de equipamentos
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
    enabled: !!authState.user,
  });
};

// Hook para obter o crescimento de equipamentos no último mês
export const useEquipmentGrowth = (days: number = 30) => {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['equipmentGrowth', days],
    queryFn: async () => {
      const xDaysAgo = subDays(new Date(), days).toISOString();
      const twoXDdaysAgo = subDays(new Date(), days * 2).toISOString();

      const { count: currentCount, error: currentError } = await supabase
        .from('equipments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', xDaysAgo);

      if (currentError) throw currentError;

      const { count: previousCount, error: previousError } = await supabase
        .from('equipments')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', xDaysAgo)
        .gte('created_at', twoXDdaysAgo);

      if (previousError) throw previousError;

      if (previousCount === 0) {
        return { percentage: null, isPositive: currentCount > 0 };
      }

      const percentage = ((currentCount - previousCount) / previousCount) * 100;
      return { percentage, isPositive: percentage >= 0 };
    },
    enabled: !!authState.user,
  });
};

// NOVO HOOK: Calcula o MTTC (Tempo Médio de Limpeza)
export const useMTTC = () => {
  return useQuery({
    queryKey: ['mttc'],
    queryFn: async () => {
      const { data: maintenances, error } = await supabase
        .from('maintenances')
        .select('performed_at, equipment_id, updated_at:equipments(updated_at)')
        .eq('service_type', 'limpeza') // <-- Altera a condição para 'limpeza'
        .order('performed_at', { ascending: false });

      if (error) throw new Error(error.message);

      const repairsWithEndTime = maintenances.filter(m => m.updated_at);
      if (repairsWithEndTime.length === 0) return null;

      const totalRepairTime = repairsWithEndTime.reduce((sum, m) => {
        const repairStart = parseISO(m.performed_at);
        const repairEnd = parseISO((m.updated_at as any).updated_at);
        const durationInMinutes = differenceInMinutes(repairEnd, repairStart);
        return sum + durationInMinutes;
      }, 0);

      const averageRepairTime = totalRepairTime / repairsWithEndTime.length;
      return averageRepairTime; // Retorna em minutos
    },
  });
};


// NOVO HOOK: Busca e agrega manutenções por setor ou responsável nos últimos 6 meses
export const useMaintenanceMetrics = () => {
    const cutoffDate = subDays(new Date(), 180).toISOString();
    return useQuery({
        queryKey: ['maintenanceMetrics'],
        queryFn: async () => {
            const { data: maintenances, error } = await supabase
                .from('maintenances')
                .select(`
                    equipment_id,
                    performed_at,
                    equipments (
                        sector_id,
                        responsible_id,
                        sectors (name),
                        responsibles (name)
                    )
                `)
                .gte('performed_at', cutoffDate);

            if (error) throw new Error(error.message);

            const bySector = maintenances.reduce((acc, m) => {
                const sectorName = m.equipments?.sectors?.name || 'Sem Setor';
                acc[sectorName] = (acc[sectorName] || 0) + 1;
                return acc;
            }, {} as { [key: string]: number });

            const byResponsible = maintenances.reduce((acc, m) => {
                const responsibleName = m.equipments?.responsibles?.name || 'Não Atribuído';
                acc[responsibleName] = (acc[responsibleName] || 0) + 1;
                return acc;
            }, {} as { [key: string]: number });

            return {
                bySector: Object.keys(bySector).map(name => ({ name, count: bySector[name] })),
                byResponsible: Object.keys(byResponsible).map(name => ({ name, count: byResponsible[name] }))
            };
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
      queryClient.invalidateQueries({ queryKey: ['equipmentsCount'] });
      queryClient.invalidateQueries({ queryKey: ['allEquipments'] });
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
      queryClient.invalidateQueries({ queryKey: ['allEquipments'] });
      queryClient.invalidateQueries({ queryKey: ['equipmentAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['mttr'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceMetrics'] });
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
      queryClient.invalidateQueries({ queryKey: ['allEquipments'] });
      queryClient.invalidateQueries({ queryKey: ['equipmentAlerts'] });
    }
  });
};