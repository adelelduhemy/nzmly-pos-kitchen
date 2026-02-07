import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StockAdjustmentParams {
    itemId: string;
    quantity: number; // Positive for increase, negative for decrease
    reason?: string;
}

export const useAdjustStock = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ itemId, quantity, reason }: StockAdjustmentParams) => {
            // Use database RPC function for atomic update
            const { data, error } = await supabase.rpc('adjust_inventory_stock', {
                p_item_id: itemId,
                p_quantity: quantity,
                p_reason: reason || (quantity > 0 ? 'Manual stock increase' : 'Manual stock decrease'),
            });

            if (error) throw error;
            return data;
        },
        onSuccess: async (data, variables) => {
            // Parse the data if it's a string (RPC sometimes returns JSON as string)
            const result = typeof data === 'string' ? JSON.parse(data) : data;

            // Invalidate queries first to refresh data
            await queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
            await queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] });

            // Show toast after data is refreshed
            toast.success('Stock updated', {
                description: `Stock changed from ${Number(result.previous_stock).toFixed(2)} to ${Number(result.new_stock).toFixed(2)}`,
            });
        },
        onError: (error: any) => {
            console.error('Stock adjustment error:', error);
            toast.error('Failed to update stock', {
                description: error.message || 'Please try again',
            });
        },
    });
};
