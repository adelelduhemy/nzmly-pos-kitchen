import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type RestaurantTable = Database['public']['Tables']['restaurant_tables']['Row'];
type RestaurantTableInsert = Database['public']['Tables']['restaurant_tables']['Insert'];
type RestaurantTableUpdate = Database['public']['Tables']['restaurant_tables']['Update'];

export function useTables() {
    const queryClient = useQueryClient();

    const { data: tables = [], isLoading } = useQuery({
        queryKey: ['restaurant_tables'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('is_active', true)
                .order('table_number');

            if (error) throw error;
            return data as RestaurantTable[];
        },
    });

    const createTable = useMutation({
        mutationFn: async (table: RestaurantTableInsert) => {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .insert(table)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
            toast.success('تم إضافة الطاولة بنجاح');
        },
        onError: (error: any) => {
            toast.error('فشل في إضافة الطاولة: ' + error.message);
        },
    });

    const updateTable = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: RestaurantTableUpdate }) => {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
            toast.success('تم تحديث الطاولة بنجاح');
        },
        onError: (error: any) => {
            toast.error('فشل في تحديث الطاولة: ' + error.message);
        },
    });

    const deleteTable = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('restaurant_tables')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
            toast.success('تم حذف الطاولة بنجاح');
        },
        onError: (error: any) => {
            toast.error('فشل في حذف الطاولة: ' + error.message);
        },
    });

    const updateTableStatus = useMutation({
        mutationFn: async ({ id, status, orderId }: { id: string; status: string; orderId?: string | null }) => {
            const updates: RestaurantTableUpdate = { status };
            if (orderId !== undefined) {
                updates.current_order_id = orderId;
            }

            const { data, error } = await supabase
                .from('restaurant_tables')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['restaurant_tables'] });
        },
        onError: (error: any) => {
            toast.error('فشل في تحديث حالة الطاولة: ' + error.message);
        },
    });

    return {
        tables,
        isLoading,
        createTable: createTable.mutate,
        updateTable: updateTable.mutate,
        deleteTable: deleteTable.mutate,
        updateTableStatus: updateTableStatus.mutate,
    };
}
