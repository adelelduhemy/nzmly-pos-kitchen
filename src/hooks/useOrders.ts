import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface Order {
    id: string;
    order_number: string;
    order_type: string;
    table_number: string | null;
    subtotal: number;
    vat: number;
    discount: number;
    total: number;
    payment_method: string | null;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    order_items: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    dish_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes: string | null;
}

export const useOrders = () => {
    const queryClient = useQueryClient();

    // Fetch orders with their items
    const ordersQuery = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items (*)
        `)
                .in('status', ['pending', 'preparing', 'ready'])
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as Order[];
        },
        refetchInterval: 5000, // Backup polling every 5 seconds
    });

    // Set up real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('orders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                },
                (payload) => {
                    // Invalidate and refetch orders
                    queryClient.invalidateQueries({ queryKey: ['orders'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return ordersQuery;
};

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
            const { data, error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;
            
            // If order is completed, free the table by table_number
            if (status === 'completed' && data.table_number) {
                await supabase
                    .from('restaurant_tables')
                    .update({ 
                        status: 'available',
                        current_order_id: null 
                    })
                    .eq('table_number', data.table_number);
            }
            
            return data;
        },
        onSuccess: (_, variables) => {
            toast.success('Order status updated', {
                description: `Status changed to ${variables.status}`,
            });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
        },
        onError: (error: any) => {
            toast.error('Failed to update order status', {
                description: error.message,
            });
        },
    });
};
