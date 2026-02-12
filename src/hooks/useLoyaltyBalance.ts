import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LoyaltyBalance {
    exists: boolean;
    points: number;
    name: string | null;
    redemption_rate: number;
    max_discount: number;
}

export const useLoyaltyBalance = (phone: string) => {
    return useQuery({
        queryKey: ['loyalty_balance', phone],
        queryFn: async () => {
            if (!phone || phone.length < 8) return null;

            const { data, error } = await supabase.rpc('get_guest_loyalty_balance', { p_phone: phone });

            if (error) {
                console.error('Error fetching loyalty balance:', error);
                throw error;
            }

            return data as LoyaltyBalance;
        },
        enabled: !!phone && phone.length >= 8,
        retry: false
    });
};
