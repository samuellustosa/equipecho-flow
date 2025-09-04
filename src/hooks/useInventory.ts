import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category_id?: string | null;
  location_id?: string | null;
  current_quantity: number;
  minimum_quantity: number;
  unit: string;
  status: 'normal' | 'baixo' | 'critico';
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
  };
  locations?: {
    name: string;
  };
}

// Hook para buscar TODOS os itens do inventário
export const useAllInventory = () => {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['allInventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          categories (name),
          locations (name)
        `)
        .order('name');

      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!authState.user,
  });
};

// Hook para buscar itens do inventário com paginação
export const useInventory = (limit: number = 10, offset: number = 0) => {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['inventory', { limit, offset }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          categories (name),
          locations (name)
        `)
        .order('name')
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!authState.user,
  });
};

// Hook para obter a contagem total de itens do inventário
export const useInventoryCount = () => {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['inventoryCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count as number;
    },
    enabled: !!authState.user,
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'categories' | 'locations'>) => {
      const { data, error } = await supabase
        .from('inventory')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryCount'] });
      queryClient.invalidateQueries({ queryKey: ['allInventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
    }
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  const { setAuthUser } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...item }: Partial<Omit<InventoryItem, 'current_quantity'>> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory')
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['allInventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
    }
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryCount'] });
      queryClient.invalidateQueries({ queryKey: ['allInventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
    }
  });
};