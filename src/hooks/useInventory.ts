import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth'; // Importar o hook de autenticação

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

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
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
    }
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
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] }); //
    }
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  const { setAuthUser } = useAuth(); //
  
  return useMutation({
    mutationFn: async ({ id, ...item }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory')
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] }); //
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
      queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] }); //
    }
  });
};