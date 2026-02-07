import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MenuCategoryFromDB {
    id: string;
    name_ar: string;
    name_en: string;
    description_ar?: string | null; // Optional if not in DB schema but good to have in type if needed later
    description_en?: string | null;
    image_url: string | null;
    is_active: boolean;
    display_order: number | null;
}

export const useMenuCategories = () => {
    return useQuery({
        queryKey: ['menu-categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('menu_categories')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data as MenuCategoryFromDB[];
        },
    });
};
