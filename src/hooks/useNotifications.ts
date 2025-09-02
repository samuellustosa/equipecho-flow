import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';
import { useMemo } from 'react';
import { useAuth } from './useAuth';

export interface EquipmentAlert {
  id: string;
  name: string;
  next_cleaning: string;
  daysUntilDue: number;
  type: 'warning' | 'overdue';
}

export interface InventoryAlert {
  id: string;
  name: string;
  current_quantity: number;
  minimum_quantity: number;
  type: 'low' | 'critical';
}

export const useEquipmentAlerts = () => {
  const { authState } = useAuth();
  
  return useQuery<EquipmentAlert[], Error>({
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
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });
};

export const useInventoryAlerts = () => {
  const { authState } = useAuth();

  return useQuery<InventoryAlert[], Error>({
    queryKey: ['inventoryAlerts'],
    queryFn: async () => {
      if (!authState.user?.low_stock_alerts_enabled) {
        return [];
      }

      const { data: inventory, error } = await supabase
        .from('inventory')
        .select(`id, name, current_quantity, minimum_quantity`);

      if (error) throw new Error(error.message);

      return inventory.filter(i => {
        const status = (i.current_quantity / i.minimum_quantity) * 100;
        return status <= 100; // Estoque baixo ou crítico
      }).map(i => {
        const status = (i.current_quantity / i.minimum_quantity) * 100;
        return {
          id: i.id,
          name: i.name,
          current_quantity: i.current_quantity,
          minimum_quantity: i.minimum_quantity,
          type: status <= 50 ? 'critical' : 'low',
        };
      });
    },
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });
};

export const useFilteredAlerts = (maxAgeInDays: number) => {
  const { data: equipmentAlerts = [] } = useEquipmentAlerts();
  const { data: inventoryAlerts = [] } = useInventoryAlerts();

  const allAlerts = useMemo(() => [...equipmentAlerts, ...inventoryAlerts], [equipmentAlerts, inventoryAlerts]);
  const now = new Date();
  
  return allAlerts.filter(alert => {
    // Para equipamentos, usamos a data da próxima limpeza como referência
    // Para inventário, vamos assumir que não temos uma data de "criação do alerta", então eles sempre aparecem
    if ('next_cleaning' in alert) {
      const alertDate = new Date(alert.next_cleaning);
      const daysOld = differenceInDays(now, alertDate);
      return daysOld < maxAgeInDays;
    }
    return true;
  });
};