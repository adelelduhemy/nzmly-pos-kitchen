import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';
import { useEffect } from 'react';

export interface TopSellingItem {
  name: string;
  quantity: number;
  revenue: number;
}

export const useTopSellingItems = () => {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('top-selling-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['top-selling-items'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['top-selling-items'],
    queryFn: async (): Promise<TopSellingItem[]> => {
      const today = new Date();
      const start = startOfDay(today).toISOString();
      const end = endOfDay(today).toISOString();

      // Get today's order items, excluding cancelled orders
      const { data, error } = await supabase
        .from('order_items')
        .select('dish_name, quantity, total_price, orders!inner(status)')
        .gte('created_at', start)
        .lte('created_at', end)
        .neq('orders.status', 'cancelled');

      if (error) throw error;

      // Aggregate by dish name
      const itemMap = new Map<string, { quantity: number; revenue: number }>();

      (data || []).forEach((item) => {
        const existing = itemMap.get(item.dish_name);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += Number(item.total_price);
        } else {
          itemMap.set(item.dish_name, {
            quantity: item.quantity,
            revenue: Number(item.total_price),
          });
        }
      });

      // Convert to array and sort by quantity
      const items = Array.from(itemMap.entries()).map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.revenue,
      }));

      return items.sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    },
    refetchInterval: false, // Real-time updates instead of polling
  });
};
