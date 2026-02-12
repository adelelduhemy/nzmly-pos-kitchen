import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreateOnlineOrderParams {
    p_customer_name: string;
    p_customer_phone: string;
    p_customer_address: string;
    p_order_type: 'delivery' | 'takeaway';
    p_payment_method: 'cash' | 'card';
    p_subtotal: number;
    p_vat: number;
    p_total: number;
    p_items: any[];
    p_notes?: string;
    p_redeemed_points?: number;
}

export const useCreateOnlineOrder = () => {
    return useMutation({
        mutationFn: async (params: CreateOnlineOrderParams) => {
            console.log('Submitting order:', params);
            const { data, error } = await supabase.rpc('create_online_order', params);
            if (error) {
                console.error('RPC Error:', error);
                throw error;
            }
            return data;
        },
        onSuccess: (data) => {
            console.log('Order created:', data);
        },
        onError: (error: any) => {
            console.error('Order submission failed:', error);
            toast.error(error.message || 'Failed to submit order');
        },
    });
};
