import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type WorkflowStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

interface UpdateWorkflowStatusParams {
    orderId: string;
    status: WorkflowStatus;
    expectedVersion: number; // Required for optimistic locking
}

interface RpcResponse {
    success: boolean;
    error?: string;
    order?: any;
    current_version?: number;
    current_status?: string;
}

export const useUpdateWorkflowStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, status, expectedVersion }: UpdateWorkflowStatusParams) => {
            // Stock return for cancellations is now handled atomically
            // inside the update_order_status RPC (with idempotency guard)

            // Use the new RPC with optimistic locking
            const { data, error } = await supabase.rpc('update_order_status', {
                p_order_id: orderId,
                p_new_status: status,
                p_expected_version: expectedVersion,
            });

            if (error) throw error;

            const result = data as unknown as RpcResponse;

            if (!result.success) {
                // Optimistic lock failure or invalid transition
                throw new Error(result.error || 'Update failed');
            }

            const updatedOrder = result.order;

            return updatedOrder;
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
            queryClient.invalidateQueries({ queryKey: ['customer_stats'] });
        },
        onError: (error: any) => {
            console.error('Update order status error:', error);

            // Check for conflict error (optimistic lock failure)
            if (error.message?.includes('Conflict')) {
                toast.error('Conflict Detected', {
                    description: 'This order was updated by someone else. Please refresh and try again.',
                });
            } else if (error.message?.includes('Invalid status transition')) {
                toast.error('Cannot Update Status', {
                    description: error.message,
                });
            } else {
                toast.error('Failed to update order', {
                    description: error.message || 'Please try again',
                });
            }
        },
    });
};
