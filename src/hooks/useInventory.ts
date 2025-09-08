import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Tipos
export type InventoryItem = Tables<'inventory'>;
export type InventoryMovement = Tables<'inventory_movements'> & {
  inventory_items: { name: string } | null;
};
export type InventoryCategory = Tables<'categories'>;
export type InventoryLocation = Tables<'locations'>;

// NOVO TIPO: Adicionado para incluir as relações
export type ExtendedInventoryItem = InventoryItem & {
  categories: { name: string } | null;
  locations: { name: string } | null;
};

interface GetMovementsOptions {
  limit?: number;
  enabled?: boolean;
}

// Hooks
export const useInventory = () => {
  return useQuery<ExtendedInventoryItem[], Error>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          categories(name),
          locations(name)
        `);
      if (error) throw new Error(error.message);
      return data as ExtendedInventoryItem[];
    },
  });
};

export const useAllInventory = () => {
  return useQuery<ExtendedInventoryItem[], Error>({
    queryKey: ['allInventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`*, categories(name), locations(name)`);
      if (error) throw new Error(error.message);
      return data as ExtendedInventoryItem[];
    },
  });
};

export const useInventoryMovements = ({ limit, enabled = true }: GetMovementsOptions = {}) => {
  return useQuery<InventoryMovement[], Error>({
    queryKey: ['inventoryMovements', limit],
    queryFn: async () => {
      let query = supabase
        .from('inventory_movements')
        .select(`*, inventory_items:inventory(name)`)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as InventoryMovement[];
    },
    enabled,
  });
};

export const useInventoryItem = (id: string) => {
  return useQuery<ExtendedInventoryItem | null, Error>({
    queryKey: ['inventoryItem', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          categories(name),
          locations(name)
        `)
        .eq('id', id)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message);
      }
      return data as ExtendedInventoryItem;
    },
  });
};

export const useInventoryCount = () => {
  return useQuery<number, Error>({
    queryKey: ['inventoryCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
      return count as number;
    },
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: TablesInsert<'inventory'>) => {
      const { data, error } = await supabase
        .from('inventory')
        .insert(item)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryCount'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: TablesUpdate<'inventory'>) => {
      if (!item.id) throw new Error('ID do item de inventário é obrigatório para atualização.');
      const { data, error } = await supabase
        .from('inventory')
        .update(item)
        .eq('id', item.id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
    },
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
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryCount'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
    },
  });
};

export const useCategories = () => {
  return useQuery<InventoryCategory[], Error>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const useLocations = () => {
  return useQuery<InventoryLocation[], Error>({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const useCreateInventoryMovement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movement: TablesInsert<'inventory_movements'>) => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert(movement)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryMovements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
    },
  });
};