import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type WorkflowStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

interface UpdateWorkflowStatusParams {
    orderId: string;
    status: WorkflowStatus;
}

export const useUpdateWorkflowStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, status }: UpdateWorkflowStatusParams) => {
            const { data, error } = await supabase
                .from('orders')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            toast.success('Order cancelled', {
                description: `Order has been cancelled`,
            });

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['order-history'] });
            queryClient.invalidateQueries({ queryKey: ['order-stats'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error: any) => {
            console.error('Update order status error:', error);
            toast.error('Failed to cancel order', {
                description: error.message || 'Please try again',
            });
        },
    });
};
