import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ChefHat, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RecipeAssignment {
    menuItemId: string;
    menuItemName: string;
    quantity: string;
}

interface InventoryItem {
    id: string;
    name_en: string;
    name_ar: string;
    unit: string;
    current_stock: number;
    minimum_stock: number;
    cost_per_unit: number;
}

interface EditInventoryItemDialogProps {
    item: InventoryItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EditInventoryItemDialog = ({ item, open, onOpenChange }: EditInventoryItemDialogProps) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const queryClient = useQueryClient();

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

    // Load item data when dialog opens
    useEffect(() => {
        if (item && open) {
            setFormData({
                name_en: item.name_en,
                name_ar: item.name_ar,
                unit: item.unit,
                current_stock: item.current_stock.toString(),
                minimum_stock: item.minimum_stock.toString(),
                cost_per_unit: item.cost_per_unit.toString(),
            });
            loadExistingRecipes(item.id);
        }
    }, [item, open]);

    // Load existing recipes
    const loadExistingRecipes = async (itemId: string) => {
        const { data, error } = await supabase
            .from('recipes')
            .select(`
                menu_item_id,
                quantity,
                menu_items:menu_item_id (
                    name_en,
                    name_ar
                )
            `)
            .eq('inventory_item_id', itemId);

        if (error) {
            console.error('Error loading recipes:', error);
            return;
        }

        const loadedRecipes = data.map((recipe: any) => ({
            menuItemId: recipe.menu_item_id,
            menuItemName: isRTL ? recipe.menu_items.name_ar : recipe.menu_items.name_en,
            quantity: recipe.quantity.toString(),
        }));

        setRecipes(loadedRecipes);
    };

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

    const updateItemMutation = useMutation({
        mutationFn: async () => {
            if (!item) return;

            // Update inventory item
            const { error: itemError } = await supabase
                .from('inventory_items')
                .update({
                    name_en: formData.name_en,
                    name_ar: formData.name_ar,
                    unit: formData.unit,
                    current_stock: parseFloat(formData.current_stock) || 0,
                    minimum_stock: parseFloat(formData.minimum_stock) || 0,
                    cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
                })
                .eq('id', item.id);

            if (itemError) throw itemError;

            // Delete existing recipes
            const { error: deleteError } = await supabase
                .from('recipes')
                .delete()
                .eq('inventory_item_id', item.id);

            if (deleteError) throw deleteError;

            // Insert new recipes
            if (recipes.length > 0) {
                const recipeInserts = recipes.map(recipe => ({
                    menu_item_id: recipe.menuItemId,
                    inventory_item_id: item.id,
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
            onOpenChange(false);
            toast.success('Ingredient updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateItemMutation.mutate();
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

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{isRTL ? 'تعديل المكون' : 'Edit Ingredient'}</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-100px)] pr-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic Information */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name_en">{isRTL ? 'الاسم بالإنجليزية' : 'Name (English)'}</Label>
                                <Input
                                    id="name_en"
                                    required
                                    value={formData.name_en}
                                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                    placeholder="Chicken"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name_ar">{isRTL ? 'الاسم بالعربية' : 'Name (Arabic)'}</Label>
                                <Input
                                    id="name_ar"
                                    required
                                    value={formData.name_ar}
                                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    placeholder="دجاج"
                                    dir="rtl"
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
                                        <SelectItem value="kg">{isRTL ? 'كيلوجرام' : 'Kilogram (kg)'}</SelectItem>
                                        <SelectItem value="g">{isRTL ? 'جرام' : 'Gram (g)'}</SelectItem>
                                        <SelectItem value="l">{isRTL ? 'لتر' : 'Liter (l)'}</SelectItem>
                                        <SelectItem value="ml">{isRTL ? 'ملي لتر' : 'Milliliter (ml)'}</SelectItem>
                                        <SelectItem value="pcs">{isRTL ? 'قطعة' : 'Pieces'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cost_per_unit">{isRTL ? 'التكلفة لكل وحدة' : 'Cost per Unit'}</Label>
                                <Input
                                    id="cost_per_unit"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={formData.cost_per_unit}
                                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="current_stock">{isRTL ? 'المخزون الحالي' : 'Current Stock'}</Label>
                                <Input
                                    id="current_stock"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={formData.current_stock}
                                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="minimum_stock">{isRTL ? 'الحد الأدنى' : 'Minimum Stock'}</Label>
                                <Input
                                    id="minimum_stock"
                                    type="number"
                                    step="0.01"
                                    min="0"
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
                                <Label>{isRTL ? 'يُستخدم في الأطباق (اختياري)' : 'Used in Menu Items (Optional)'}</Label>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                {isRTL
                                    ? 'حدد الأطباق التي تستخدم هذا المكون وكم سيتم خصمه من كل طلب'
                                    : 'Select dishes that use this ingredient and how much will be deducted per order'
                                }
                            </p>

                            {recipes.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                                        <span>{isRTL ? 'الوصفات المضافة:' : 'Recipes Added:'}</span>
                                        <span>{isRTL ? 'الكمية المخصومة لكل طلب' : 'Amount deducted per order'}</span>
                                    </div>
                                    {recipes.map((recipe) => (
                                        <div key={recipe.menuItemId} className="flex items-center gap-2">
                                            <Badge variant="secondary" className="flex-1">
                                                {recipe.menuItemName}
                                            </Badge>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={recipe.quantity}
                                                onChange={(e) => updateRecipeQuantity(recipe.menuItemId, e.target.value)}
                                                className="w-24"
                                            />
                                            <span className="text-sm text-muted-foreground w-8">{formData.unit}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeRecipe(recipe.menuItemId)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder={isRTL ? 'اختر طبق' : 'Select a dish'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {menuItems
                                            .filter(item => !recipes.some(r => r.menuItemId === item.id))
                                            .map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {isRTL ? item.name_ar : item.name_en}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" onClick={addRecipe} disabled={!selectedMenuItem}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                {isRTL ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button type="submit" disabled={updateItemMutation.isPending}>
                                {updateItemMutation.isPending
                                    ? (isRTL ? 'جاري الحفظ...' : 'Saving...')
                                    : (isRTL ? 'حفظ' : 'Save')}
                            </Button>
                        </div>
                    </form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default EditInventoryItemDialog;
