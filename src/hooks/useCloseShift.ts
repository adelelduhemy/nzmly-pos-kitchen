import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface CloseShiftParams {
    shiftId: string;
    closingCash: number;
    notes?: string | null;
}

interface CloseShiftResponse {
    success: boolean;
    summary?: any;
    error?: string;
}

export const useCloseShift = () => {
    const { toast } = useToast();
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const isAr = i18n.language === 'ar';

    return useMutation({
        mutationFn: async ({ shiftId, closingCash, notes }: CloseShiftParams) => {
            // @ts-ignore - RPC type not yet generated
            const { data, error } = await supabase.rpc('close_shift_with_sales' as any, {
                p_shift_id: shiftId,
                p_closing_cash: closingCash,
                p_notes: notes || null,
            });

            if (error) throw error;

            const result = data as unknown as CloseShiftResponse;
            if (!result.success) {
                throw new Error(result.error || 'Failed to close shift');
            }

            return result;
        },
        onSuccess: (data) => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            queryClient.invalidateQueries({ queryKey: ['expenses'] }); // Expenses might be related? Maybe not.

            toast({
                title: isAr ? 'تم بنجاح' : 'Success',
                description: isAr
                    ? `تم إقفال الشيفت • إجمالي المبيعات: ${data.summary?.total_sales ?? 0} ر.س`
                    : `Shift closed • Total sales: SAR ${data.summary?.total_sales ?? 0}`,
            });
        },
        onError: (error: any) => {
            console.error('Error closing shift:', error);
            toast({
                title: isAr ? 'خطأ' : 'Error',
                description: error.message || (isAr ? 'فشل في إقفال الشيفت' : 'Failed to close shift'),
                variant: 'destructive',
            });
        },
    });
};
