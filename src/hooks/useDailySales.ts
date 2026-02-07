import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, format } from 'date-fns';
import { useEffect } from 'react';

export interface HourlySales {
  hour: string;
  sales: number;
}

export const useDailySales = () => {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('daily-sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['daily-sales'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['daily-sales'],
    queryFn: async (): Promise<HourlySales[]> => {
      const today = new Date();
      const start = startOfDay(today).toISOString();
      const end = endOfDay(today).toISOString();

      // Get today's completed/paid orders, excluding cancelled
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total, status')
        .gte('created_at', start)
        .lte('created_at', end)
        .neq('status', 'cancelled');

      if (error) throw error;

      // Initialize all hours with 0 sales (12AM to 11PM)
      const hours: HourlySales[] = [
        { hour: '12AM', sales: 0 },
        { hour: '1AM', sales: 0 },
        { hour: '2AM', sales: 0 },
        { hour: '3AM', sales: 0 },
        { hour: '4AM', sales: 0 },
        { hour: '5AM', sales: 0 },
        { hour: '6AM', sales: 0 },
        { hour: '7AM', sales: 0 },
        { hour: '8AM', sales: 0 },
        { hour: '9AM', sales: 0 },
        { hour: '10AM', sales: 0 },
        { hour: '11AM', sales: 0 },
        { hour: '12PM', sales: 0 },
        { hour: '1PM', sales: 0 },
        { hour: '2PM', sales: 0 },
        { hour: '3PM', sales: 0 },
        { hour: '4PM', sales: 0 },
        { hour: '5PM', sales: 0 },
        { hour: '6PM', sales: 0 },
        { hour: '7PM', sales: 0 },
        { hour: '8PM', sales: 0 },
        { hour: '9PM', sales: 0 },
        { hour: '10PM', sales: 0 },
        { hour: '11PM', sales: 0 },
      ];

      // Aggregate sales by hour
      (data || []).forEach((order) => {
        const orderDate = new Date(order.created_at);
        const hourStr = format(orderDate, 'ha').toUpperCase();
        const hourIndex = hours.findIndex((h) => h.hour === hourStr);
        if (hourIndex !== -1) {
          hours[hourIndex].sales += Number(order.total);
        }
      });

      return hours;
    },
    refetchInterval: false, // Real-time updates instead of polling
  });
};
