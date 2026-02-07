import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface LowStockAlert {
  id: string;
  nameEn: string;
  nameAr: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  severity: 'warning' | 'error';
}

export const useLowStockAlerts = () => {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async (): Promise<LowStockAlert[]> => {
      // Fetch items where current_stock might be low (filter client-side since we compare two columns)
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name_en, name_ar, current_stock, minimum_stock, unit')
        .order('current_stock', { ascending: true });

      if (error) throw error;

      // Filter items where current_stock < minimum_stock
      const lowStockItems = (data || []).filter(item => 
        item.current_stock < item.minimum_stock
      );

      return lowStockItems.map(item => ({
        id: item.id,
        nameEn: item.name_en,
        nameAr: item.name_ar,
        currentStock: item.current_stock,
        minimumStock: item.minimum_stock,
        unit: item.unit,
        severity: item.current_stock < item.minimum_stock / 2 ? 'error' : 'warning',
      }));
    },
    refetchInterval: false, // Real-time updates instead of polling
  });
};
