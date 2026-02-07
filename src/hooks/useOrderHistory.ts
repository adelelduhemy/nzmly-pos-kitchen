import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';

export interface OrderHistoryItem {
    id: string;
    order_number: string;
    order_type: 'dine-in' | 'takeaway' | 'delivery';
    table_number: string | null;
    subtotal: number;
    vat: number;
    discount: number;
    total: number;
    payment_method: 'cash' | 'card' | 'online';
    status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'completed';
    payment_status: 'paid' | 'unpaid';
    cashier_id: string | null;
    created_at: string;
    updated_at: string;
    order_items: Array<{
        id: string;
        dish_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        notes: string | null;
    }>;
}

interface UseOrderHistoryParams {
    searchQuery?: string;
    statusFilter?: string;
    startDate?: Date | null;
    endDate?: Date | null;
}

export const useOrderHistory = (params: UseOrderHistoryParams = {}) => {
    const { searchQuery = '', statusFilter = 'all', startDate, endDate } = params;

    return useQuery({
        queryKey: ['order-history', searchQuery, statusFilter, startDate, endDate],
        queryFn: async () => {
            let query = supabase
                .from('orders')
                .select(`
          *,
          order_items (
            id,
            dish_name,
            quantity,
            unit_price,
            total_price,
            notes
          )
        `)
                .order('created_at', { ascending: false });

            // Apply search filter (order number)
            if (searchQuery) {
                query = query.ilike('order_number', `%${searchQuery}%`);
            }

            // Apply status filter
            if (statusFilter && statusFilter !== 'all') {
                // If filtering by 'paid', check payment_status instead of status
                if (statusFilter === 'paid') {
                    query = query.eq('payment_status', 'paid');
                } else {
                    query = query.eq('status', statusFilter);
                }
            }

            // Apply date range filter
            if (startDate) {
                query = query.gte('created_at', startOfDay(startDate).toISOString());
            }
            if (endDate) {
                query = query.lte('created_at', endOfDay(endDate).toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;

            // Type assertion since Supabase types may not have payment_status yet
            return (data || []) as OrderHistoryItem[];
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });
};

// Hook to get order statistics
export const useOrderStats = (startDate?: Date | null, endDate?: Date | null) => {
    return useQuery({
        queryKey: ['order-stats', startDate, endDate],
        queryFn: async () => {
            let query = supabase.from('orders').select('status, total, payment_method, payment_status');

            if (startDate) {
                query = query.gte('created_at', startOfDay(startDate).toISOString());
            }
            if (endDate) {
                query = query.lte('created_at', endOfDay(endDate).toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;

            const orders = data || [];

            // Calculate statistics
            const totalOrders = orders.length;
            const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Count by workflow status
            const statusCounts = orders.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            // Count by payment status
            const paymentStatusCounts = orders.reduce((acc, order) => {
                const paymentStatus = order.payment_status || 'unpaid';
                acc[paymentStatus] = (acc[paymentStatus] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            // Count by payment method
            const paymentMethodCounts = orders.reduce((acc, order) => {
                acc[order.payment_method] = (acc[order.payment_method] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return {
                totalOrders,
                totalRevenue,
                averageOrderValue,
                statusCounts,
                paymentStatusCounts,
                paymentMethodCounts,
            };
        },
    });
};
