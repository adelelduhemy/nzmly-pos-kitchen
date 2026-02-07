
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RecipeAssignment {
    menuItemId: string;
    menuItemName: string;
    quantity: string;
}

const AddInventoryItemDialog = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    const [formData, setFormData] = useState({
        name_en: '',
        name_ar: '',
        unit: 'kg',
        current_stock: '',
        minimum_stock: '',
        cost_per_unit: '',
    });

    const [recipes, setRecipes] = useState<RecipeAssignment[]>([]);
    const [selectedMenuItem, setSelectedMenuItem] = useState<string>('');

    // Fetch menu items for recipe assignment
    const { data: menuItems = [] } = useQuery({
        queryKey: ['menu_items'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('menu_items')
                .select('id, name_en, name_ar, category')
                .eq('is_available', true)
                .order('name_en');
            if (error) throw error;
            return data;
        },
        enabled: open,
    });

    const createItemMutation = useMutation({
        mutationFn: async () => {
            // First get the default warehouse (Raw Materials)
            const { data: warehouseData, error: warehouseError } = await supabase
                .from('warehouses')
                .select('id')
                .eq('type', 'raw_materials')
                .limit(1)
                .single();

            if (warehouseError) throw warehouseError;

            // Create inventory item
            const { data: inventoryItem, error: itemError } = await supabase
                .from('inventory_items')
                .insert({
                    warehouse_id: warehouseData.id,
                    name_en: formData.name_en,
                    name_ar: formData.name_ar,
                    unit: formData.unit,
                    current_stock: parseFloat(formData.current_stock) || 0,
                    minimum_stock: parseFloat(formData.minimum_stock) || 0,
                    cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
                })
                .select()
                .single();

            if (itemError) throw itemError;

            // Create recipes if any menu items were selected
            if (recipes.length > 0) {
                const recipeInserts = recipes.map(recipe => ({
                    menu_item_id: recipe.menuItemId,
                    inventory_item_id: inventoryItem.id,
                    quantity: parseFloat(recipe.quantity),
                    unit: formData.unit,
                }));

                const { error: recipeError } = await supabase
                    .from('recipes')
                    .insert(recipeInserts);

                if (recipeError) throw recipeError;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
            queryClient.invalidateQueries({ queryKey: ['recipe_usage'] });
            setOpen(false);
            setFormData({
                name_en: '',
                name_ar: '',
                unit: 'kg',
                current_stock: '',
                minimum_stock: '',
                cost_per_unit: '',
            });
            setRecipes([]);
            toast.success(
                recipes.length > 0
                    ? `Item added with ${recipes.length} recipe${recipes.length > 1 ? 's' : ''}!`
                    : 'Item added successfully'
            );
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createItemMutation.mutate();
    };

    const addRecipe = () => {
        if (!selectedMenuItem) return;

        const menuItem = menuItems.find(item => item.id === selectedMenuItem);
        if (!menuItem) return;

        // Check if already added
        if (recipes.some(r => r.menuItemId === selectedMenuItem)) {
            toast.error('This menu item is already added');
            return;
        }

        setRecipes([...recipes, {
            menuItemId: selectedMenuItem,
            menuItemName: isRTL ? menuItem.name_ar : menuItem.name_en,
            quantity: '0.1',
        }]);
        setSelectedMenuItem('');
    };

    const removeRecipe = (menuItemId: string) => {
        setRecipes(recipes.filter(r => r.menuItemId !== menuItemId));
    };

    const updateRecipeQuantity = (menuItemId: string, quantity: string) => {
        setRecipes(recipes.map(r =>
            r.menuItemId === menuItemId ? { ...r, quantity } : r
        ));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('inventory.addItem', 'Add Item')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{t('inventory.addItem', 'Add New Inventory Item')}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{isRTL ? 'الاسم (انجليزي)' : 'Name (English)'}</Label>
                                <Input
                                    required
                                    value={formData.name_en}
                                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                    placeholder="Chicken"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                                <Input
                                    required
                                    value={formData.name_ar}
                                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    placeholder="دجاج"
                                    className="text-right"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{isRTL ? 'الوحدة' : 'Unit'}</Label>
                                <Select
                                    value={formData.unit}
                                    onValueChange={(val) => setFormData({ ...formData, unit: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="kg">KG</SelectItem>
                                        <SelectItem value="g">Gram</SelectItem>
                                        <SelectItem value="l">Liter</SelectItem>
                                        <SelectItem value="ml">Milliliter</SelectItem>
                                        <SelectItem value="pcs">Pieces</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{isRTL ? 'التكلفة للوحدة' : 'Cost per Unit'}</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.cost_per_unit}
                                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{isRTL ? 'المخزون الحالي' : 'Current Stock'}</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.current_stock}
                                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{isRTL ? 'الحد الأدنى' : 'Minimum Stock'}</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.minimum_stock}
                                    onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Recipe Assignment */}
                        <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <ChefHat className="w-4 h-4" />
                                <Label className="text-base font-semibold">
                                    {isRTL ? 'يُستخدم في الأطباق (اختياري)' : 'Used in Menu Items (Optional)'}
                                </Label>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                {isRTL
                                    ? 'حدد الأطباق التي تستخدم هذا المكون وكم سيتم خصمه من كل طلب'
                                    : 'Select dishes that use this ingredient and how much will be deducted per order'
                                }
                            </p>

                            <div className="flex gap-2">
                                <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder={isRTL ? 'اختر طبق' : 'Select a dish'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {menuItems.map(item => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {isRTL ? item.name_ar : item.name_en} ({item.category})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" variant="outline" onClick={addRecipe} disabled={!selectedMenuItem}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            {recipes.length > 0 && (
                                <div className="space-y-2 bg-muted p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">
                                            {isRTL ? 'المكونات المضافة:' : 'Recipes Added:'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {isRTL ? 'الكمية المخصومة لكل طلب' : 'Amount deducted per order'}
                                        </span>
                                    </div>
                                    {recipes.map(recipe => (
                                        <div key={recipe.menuItemId} className="flex items-center gap-2">
                                            <Badge variant="outline" className="flex-1">
                                                {recipe.menuItemName}
                                            </Badge>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={recipe.quantity}
                                                onChange={(e) => updateRecipeQuantity(recipe.menuItemId, e.target.value)}
                                                className="w-24"
                                                placeholder="0.1"
                                            />
                                            <span className="text-sm text-muted-foreground w-10">{formData.unit}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => removeRecipe(recipe.menuItemId)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={createItemMutation.isPending}>
                            {createItemMutation.isPending ? 'Saving...' : (isRTL ? 'حفظ' : 'Save Item')}
                        </Button>
                    </form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default AddInventoryItemDialog;
