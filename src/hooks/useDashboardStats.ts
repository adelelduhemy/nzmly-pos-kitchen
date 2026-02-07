import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';
import { useEffect } from 'react';

interface DashboardStats {
  todaySales: number;
  activeOrders: number;
  occupiedTables: number;
  totalTables: number;
  averageOrderValue: number;
}

export const useDashboardStats = () => {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date();
      const start = startOfDay(today).toISOString();
      const end = endOfDay(today).toISOString();

      // Get today's orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', start)
        .lte('created_at', end);

      if (ordersError) throw ordersError;

      // Get active orders (pending, preparing, ready, served, paid)
      const { data: activeOrdersData, error: activeError } = await supabase
        .from('orders')
        .select('id')
        .in('status', ['pending', 'preparing', 'ready', 'served', 'paid']);

      if (activeError) throw activeError;

      // Get table stats
      const { data: tables, error: tablesError } = await supabase
        .from('restaurant_tables')
        .select('status');

      if (tablesError) throw tablesError;

      // Calculate stats
      const completedOrders = orders?.filter(o => o.status === 'completed') || [];
      const todaySales = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      const activeOrders = activeOrdersData?.length || 0;
      const occupiedTables = tables?.filter(t => t.status === 'occupied').length || 0;
      const totalTables = tables?.length || 0;
      
      const averageOrderValue = completedOrders.length > 0 
        ? todaySales / completedOrders.length 
        : 0;

      return {
        todaySales,
        activeOrders,
        occupiedTables,
        totalTables,
        averageOrderValue,
      };
    },
    refetchInterval: false, // Real-time updates instead of polling
  });
};
