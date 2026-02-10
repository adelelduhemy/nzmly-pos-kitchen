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
    version: number; // Added for optimistic locking
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

interface RpcResponse {
    success: boolean;
    error?: string;
    order?: any;
    current_version?: number;
    current_status?: string;
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
        mutationFn: async ({ orderId, status, expectedVersion }: { orderId: string; status: string; expectedVersion: number }) => {
            // Use the new RPC with optimistic locking
            const { data, error } = await supabase.rpc('update_order_status', {
                p_order_id: orderId,
                p_new_status: status,
                p_expected_version: expectedVersion,
            });

            if (error) throw error;

            const result = data as unknown as RpcResponse;

            if (!result.success) {
                throw new Error(result.error || 'Update failed');
            }

            const updatedOrder = result.order;

            // If order is completed, free the table by table_number
            if (status === 'completed' && updatedOrder.table_number) {
                await supabase
                    .from('restaurant_tables')
                    .update({
                        status: 'available',
                        current_order_id: null
                    })
                    .eq('table_number', updatedOrder.table_number);
            }

            return updatedOrder;
        },
        onSuccess: (_, variables) => {
            toast.success('Order status updated', {
                description: `Status changed to ${variables.status}`,
            });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
        },
        onError: (error: any) => {
            if (error.message?.includes('Conflict')) {
                toast.error('Conflict Detected', {
                    description: 'This order was updated by someone else. Refreshing...',
                });
                queryClient.invalidateQueries({ queryKey: ['orders'] });
            } else if (error.message?.includes('Invalid status transition')) {
                toast.error('Cannot Update Status', {
                    description: error.message,
                });
            } else {
                toast.error('Failed to update order status', {
                    description: error.message,
                });
            }
        },
    });
};
