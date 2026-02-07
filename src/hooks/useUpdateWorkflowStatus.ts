import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type WorkflowStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

interface UpdateWorkflowStatusParams {
    orderId: string;
    status: WorkflowStatus;
}

export const useUpdateWorkflowStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, status }: UpdateWorkflowStatusParams) => {
            // If cancelling order, return stock first
            if (status === 'cancelled') {
                try {
                    await supabase.rpc('return_order_stock', { order_id: orderId });
                } catch (err) {
                    console.error('Failed to return stock:', err);
                    // Continue with cancellation even if stock return fails
                }
            }

            const { data, error } = await supabase
                .from('orders')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;
            
            // If order is completed, free the table (table_number in orders stores the table UUID)
            if (status === 'completed' && data.table_number) {
                await supabase
                    .from('restaurant_tables')
                    .update({ 
                        status: 'available',
                        current_order_id: null 
                    })
                    .eq('id', data.table_number);
            }
            
            return data;
        },
        onSuccess: (data, variables) => {
            const statusMessages: Record<WorkflowStatus, string> = {
                'pending': 'Order marked as pending',
                'preparing': 'Order is now being prepared',
                'ready': 'Order is ready for pickup',
                'served': 'Order has been served',
                'completed': 'Order completed - table freed',
                'cancelled': 'Order has been cancelled',
            };
            
            toast.success(statusMessages[variables.status] || 'Order status updated', {
                description: `Order ${data.order_number} updated successfully`,
            });

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['order-history'] });
            queryClient.invalidateQueries({ queryKey: ['order-stats'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
        },
        onError: (error: any) => {
            console.error('Update order status error:', error);
            toast.error('Failed to cancel order', {
                description: error.message || 'Please try again',
            });
        },
    });
};
