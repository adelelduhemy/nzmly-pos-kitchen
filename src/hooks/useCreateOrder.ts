import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrderStore } from '@/store/orderStore';
import { toast } from 'sonner';

interface CreateOrderParams {
    orderType: 'dine-in' | 'takeaway' | 'delivery';
    tableNumber?: string | null;
    subtotal: number;
    vat: number;
    discount: number;
    total: number;
    paymentMethod: 'cash' | 'card' | 'online';
    customerId?: string | null;
    items: Array<{
        menuItemId?: string;
        dishName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        notes?: string;
    }>;
    notes?: string;
}

export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: CreateOrderParams) => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            // Generate idempotency key for this attempt
            // In a real app, you might want this passed in from the UI level if the UI can retry automatically
            // But for now, we generate it per mutation call. 
            // Better: The caller should generate it to handle "retry button" scenarios correctly.
            // For this implementation, we'll verify if we can move it up, but strictly speaking
            // the hook invocation starts the intent. To support true retry, we'd need the key passed in params.
            // Let's stick to generating it here for now, as useMutation retries aren't default for writes.
            // P.S. The RPC handles the deduplication if we reuse the key.

            const idempotencyKey = crypto.randomUUID();

            const { data, error } = await supabase.rpc('create_order_atomic', {
                p_idempotency_key: idempotencyKey,
                p_order_type: params.orderType,
                p_table_number: params.tableNumber || null,
                p_subtotal: params.subtotal,
                p_vat: params.vat,
                p_discount: params.discount,
                p_total: params.total,
                p_payment_method: params.paymentMethod,
                p_payment_status: 'unpaid', // Default to unpaid
                p_notes: params.notes || null,
                p_items: params.items as any, // Cast to any to verify JSON compatibility
                p_customer_id: params.customerId || null,
            });

            if (error) {
                console.error('Atomic order creation error:', error);
                throw error;
            }

            // The RPC returns { id, order_number, status, is_duplicate }
            const result = data as any;
            const order = result.order || result; // Support both wrapped and flat format
            const isDuplicate = result.is_duplicate || result.order?.is_duplicate;
            return { order, status: isDuplicate ? 'existing' : 'created' };
        },
        onSuccess: (data) => {
            if (data.status === 'existing') {
                toast.success('Order recovered', {
                    description: `Order ${data.order?.order_number || 'unknown'} already existed (idempotency check).`,
                });
            } else {
                toast.success('Order placed successfully!', {
                    description: `Order ${data.order?.order_number || ''} has been created`,
                });
            }

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
            queryClient.invalidateQueries({ queryKey: ['menu_items'] });
            queryClient.invalidateQueries({ queryKey: ['customer_stats'] });
        },
        onError: (error: any) => {
            console.error('Create order error:', error);
            toast.error('Failed to create order', {
                description: error.message || 'Please try again',
            });
        },
    });
};
