import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItemStock {
    menuItemId: string;
    hasRecipe: boolean;
    isAvailable: boolean;
    insufficientIngredients: string[];
}

/**
 * Check stock availability for menu items based on their recipes
 * Returns availability status for each menu item
 */
export const useMenuItemsStock = (menuItemIds: string[]) => {
    return useQuery({
        queryKey: ['menu-items-stock', menuItemIds],
        queryFn: async () => {
            if (!menuItemIds.length) return [];

            // Fetch recipes for all menu items
            const { data: recipes, error: recipesError } = await supabase
                .from('recipes')
                .select('menu_item_id, inventory_item_id, quantity, inventory_items(name_en, name_ar, current_stock)')
                .in('menu_item_id', menuItemIds);

            if (recipesError) throw recipesError;

            // Group recipes by menu item
            const stockByMenuItem: Record<string, MenuItemStock> = {};

            for (const menuItemId of menuItemIds) {
                stockByMenuItem[menuItemId] = {
                    menuItemId,
                    hasRecipe: false,
                    isAvailable: true,
                    insufficientIngredients: []
                };
            }

            // Check stock for each recipe
            for (const recipe of (recipes || [])) {
                const menuItem = stockByMenuItem[recipe.menu_item_id];
                if (!menuItem) continue;

                menuItem.hasRecipe = true;

                // Check if inventory has enough stock
                const inventoryStock = (recipe.inventory_items as any)?.current_stock || 0;
                if (inventoryStock < recipe.quantity) {
                    menuItem.isAvailable = false;
                    const ingredientName = (recipe.inventory_items as any)?.name_en || 'Unknown';
                    menuItem.insufficientIngredients.push(ingredientName);
                }
            }

            return Object.values(stockByMenuItem);
        },
        enabled: menuItemIds.length > 0,
        staleTime: 30000, // 30 seconds - stock changes frequently
    });
};

/**
 * Check if a specific menu item can be ordered with given quantity
 */
export const checkMenuItemStock = async (menuItemId: string, quantity: number = 1): Promise<{
    available: boolean;
    insufficientIngredients: string[];
}> => {
    const { data: recipes, error } = await supabase
        .from('recipes')
        .select('inventory_item_id, quantity, inventory_items(name_en, name_ar, current_stock)')
        .eq('menu_item_id', menuItemId);

    if (error) throw error;

    // If no recipes, item is available (no inventory needed)
    if (!recipes || recipes.length === 0) {
        return { available: true, insufficientIngredients: [] };
    }

    const insufficientIngredients: string[] = [];

    for (const recipe of recipes) {
        const requiredStock = recipe.quantity * quantity;
        const currentStock = (recipe.inventory_items as any)?.current_stock || 0;

        if (currentStock < requiredStock) {
            const ingredientName = (recipe.inventory_items as any)?.name_en || 'Unknown';
            insufficientIngredients.push(ingredientName);
        }
    }

    return {
        available: insufficientIngredients.length === 0,
        insufficientIngredients
    };
};
