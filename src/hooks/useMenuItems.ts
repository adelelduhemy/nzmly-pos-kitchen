import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItemFromDB {
    id: string;
    name_ar: string;
    name_en: string;
    description_ar: string | null;
    description_en: string | null;
    price: number;
    category: string;
    category_id?: string | null;
    image_url: string | null;
    is_available: boolean;
}

export const useMenuItems = () => {
    return useQuery({
        queryKey: ['menu-items'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .eq('is_available', true)
                .order('category', { ascending: true })
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data as MenuItemFromDB[];
        },
    });
};
