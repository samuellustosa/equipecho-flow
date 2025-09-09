import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, subDays } from 'date-fns';
import { useMemo, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface EquipmentAlert {
  id: string;
  name: string;
  next_cleaning: string;
  daysUntilDue: number;
  type: 'warning' | 'overdue';
}

// Interface corrigida para incluir created_at
export interface InventoryAlert {
  id: string;
  name: string;
  current_quantity: number;
  minimum_quantity: number;
  type: 'low' | 'critical';
  created_at: string; // Adicionado created_at aqui
}

export const useEquipmentAlerts = () => {
  const { authState } = useAuth();
  const queryClient = useQueryClient();

  // O queryFn agora retorna apenas a Promise com a lista de alertas
  const alertsQuery = useQuery<EquipmentAlert[], Error>({
    queryKey: ['equipmentAlerts'],
    queryFn: async () => {
      if (!authState.user?.overdue_maintenance_alerts_enabled) {
        return [];
      }

      const { data: equipments, error } = await supabase
        .from('equipments')
        .select(`id, name, next_cleaning`);

      if (error) throw new Error(error.message);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return equipments.filter(e => {
        const nextCleaning = new Date(e.next_cleaning);
        const daysUntilDue = differenceInDays(nextCleaning, today);
        return daysUntilDue < 0; // Apenas alertas vencidos
      }).map(e => {
        const nextCleaning = new Date(e.next_cleaning);
        const daysUntilDue = differenceInDays(nextCleaning, today);
        return {
          id: e.id,
          name: e.name,
          next_cleaning: e.next_cleaning,
          daysUntilDue,
          type: daysUntilDue < 0 ? 'overdue' : 'warning',
        };
      });
    },
    enabled: !!authState.user,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // A inscrição em tempo real agora é feita em um useEffect separado
  useEffect(() => {
    if (!authState.user) return;
    
    console.log('Setting up Realtime subscription for equipments...');
    
    const subscription = supabase
      .channel('public:equipments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipments' }, () => {
        console.log('Realtime change received for equipments, invalidating query...');
        queryClient.invalidateQueries({ queryKey: ['equipmentAlerts'] });
      })
      .subscribe();

    return () => {
      console.log('Unsubscribing from equipments realtime channel.');
      supabase.removeChannel(subscription);
    };
  }, [authState.user, queryClient]);

  return alertsQuery;
};

export const useInventoryAlerts = () => {
  const { authState } = useAuth();
  const queryClient = useQueryClient();

  const alertsQuery = useQuery<InventoryAlert[], Error>({
    queryKey: ['inventoryAlerts'],
    queryFn: async () => {
      if (!authState.user?.low_stock_alerts_enabled) {
        return [];
      }

      // Adicionado created_at à consulta de inventário
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select(`id, name, current_quantity, minimum_quantity, created_at`);

      if (error) throw new Error(error.message);

      return inventory.filter(i => {
        const status = (i.current_quantity / i.minimum_quantity) * 100;
        return status <= 100;
      }).map(i => {
        const status = (i.current_quantity / i.minimum_quantity) * 100;
        return {
          id: i.id,
          name: i.name,
          current_quantity: i.current_quantity,
          minimum_quantity: i.minimum_quantity,
          type: status <= 50 ? 'critical' : 'low',
          created_at: i.created_at,
        };
      });
    },
    enabled: !!authState.user,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (!authState.user) return;
    
    console.log('Setting up Realtime subscription for inventory...');
    
    const subscription = supabase
      .channel('public:inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        console.log('Realtime change received for inventory, invalidating query...');
        queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
      })
      .subscribe();

    return () => {
      console.log('Unsubscribing from inventory realtime channel.');
      supabase.removeChannel(subscription);
    };
  }, [authState.user, queryClient]);

  return alertsQuery;
};

export const useFilteredAlerts = (maxAgeInDays: number) => {
  const { data: equipmentAlerts = [] } = useEquipmentAlerts();
  const { data: inventoryAlerts = [] } = useInventoryAlerts();

  const allAlerts = useMemo(() => [...equipmentAlerts, ...inventoryAlerts], [equipmentAlerts, inventoryAlerts]);
  const now = new Date();
  
  return allAlerts.filter(alert => {
    if ('next_cleaning' in alert) {
      const alertDate = new Date(alert.next_cleaning);
      const daysOld = differenceInDays(now, alertDate);
      return daysOld < maxAgeInDays;
    }
    return true;
  });
};