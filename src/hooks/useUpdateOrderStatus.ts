import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PaymentStatus = 'paid' | 'unpaid';

interface UpdateOrderStatusParams {
    orderId: string;
    status: PaymentStatus;
}

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, status }: UpdateOrderStatusParams) => {
            // Update payment_status instead of status to keep workflow separate
            const { data, error } = await supabase
                .from('orders')
                .update({ payment_status: status, updated_at: new Date().toISOString() })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            toast.success('Order status updated', {
                description: `Order status changed to ${data.status}`,
            });

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['order-history'] });
            queryClient.invalidateQueries({ queryKey: ['order-stats'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error: any) => {
            console.error('Update order status error:', error);
            toast.error('Failed to update order status', {
                description: error.message || 'Please try again',
            });
        },
    });
};
