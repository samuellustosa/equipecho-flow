import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Enums } from '@/integrations/supabase/types';
import { toast } from '@/components/ui/use-toast';

export interface InventoryMovement {
  id: string;
  inventory_item_id: string;
  quantity: number;
  type: Enums<'inventory_movement_type'>;
  reason?: string | null;
  created_at: string;
}

// Hook para criar um novo registro de movimentação de inventário
export const useCreateInventoryMovement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (movement: Omit<Tables<'inventory_movements'>, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert(movement)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newMovement) => {
      // Invalida as queries de inventário e de alertas para forçar a atualização dos dados
      // CORREÇÃO: Adicionado a invalidação para 'allInventory'
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['allInventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
      // Opcionalmente, invalida a query de histórico do item específico para refletir a nova movimentação
      queryClient.invalidateQueries({ queryKey: ['inventoryMovements', newMovement.inventory_item_id] });
    },
  });
};

// Hook para buscar o histórico de movimentações de um item
export const useInventoryMovementHistory = (inventoryItemId: string) => {
  return useQuery({
    queryKey: ['inventoryMovements', inventoryItemId],
    queryFn: async () => {
      if (!inventoryItemId) return [];
      
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('inventory_item_id', inventoryItemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InventoryMovement[];
    }
  });
};