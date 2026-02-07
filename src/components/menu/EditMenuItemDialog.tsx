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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RecipeAssignment {
    inventoryItemId: string;
    inventoryItemName: string;
    quantity: string;
    unit: string;
}

interface MenuItem {
    id: string;
    name_en: string;
    name_ar: string;
    description_en: string;
    description_ar: string;
    price: number;
    category_id: string;
    image_url: string;
    is_available: boolean;
}

interface EditMenuItemDialogProps {
    item: MenuItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EditMenuItemDialog = ({ item, open, onOpenChange }: EditMenuItemDialogProps) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name_en: '',
        name_ar: '',
        description_en: '',
        description_ar: '',
        price: '',
        category_id: '',
        image_url: '',
    });

    const [recipes, setRecipes] = useState<RecipeAssignment[]>([]);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<string>('');

    // Load item data when dialog opens
    useEffect(() => {
        if (item && open) {
            setFormData({
                name_en: item.name_en,
                name_ar: item.name_ar,
                description_en: item.description_en,
                description_ar: item.description_ar,
                price: item.price.toString(),
                category_id: item.category_id || '',
                image_url: item.image_url || '',
            });
            loadExistingRecipes(item.id);
        }
    }, [item, open]);

    // Load existing recipes
    const loadExistingRecipes = async (itemId: string) => {
        const { data, error } = await supabase
            .from('recipes')
            .select(`
                inventory_item_id,
                quantity,
                unit,
                inventory_items:inventory_item_id (
                    name_en,
                    name_ar
                )
            `)
            .eq('menu_item_id', itemId);

        if (error) {
            console.error('Error loading recipes:', error);
            return;
        }

        const loadedRecipes = data.map((recipe: any) => ({
            inventoryItemId: recipe.inventory_item_id,
            inventoryItemName: isRTL ? recipe.inventory_items.name_ar : recipe.inventory_items.name_en,
            quantity: recipe.quantity.toString(),
            unit: recipe.unit,
        }));

        setRecipes(loadedRecipes);
    };

    // Fetch categories
    const { data: categories = [] } = useQuery({
        queryKey: ['menu_categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('menu_categories')
                .select('*')
                .order('name_en');
            if (error) throw error;
            return data;
        },
        enabled: open,
    });

    // Fetch inventory items for recipe assignment
    const { data: inventoryItems = [] } = useQuery({
        queryKey: ['inventory_items'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory_items')
                .select('id, name_en, name_ar, unit')
                .order('name_en');
            if (error) throw error;
            return data;
        },
        enabled: open,
    });

    const updateItemMutation = useMutation({
        mutationFn: async () => {
            if (!item) return;

            // Update menu item
            const { error: itemError } = await supabase
                .from('menu_items')
                .update({
                    name_en: formData.name_en,
                    name_ar: formData.name_ar,
                    description_en: formData.description_en,
                    description_ar: formData.description_ar,
                    price: parseFloat(formData.price) || 0,
                    category_id: formData.category_id,
                    image_url: formData.image_url || null,
                })
                .eq('id', item.id);

            if (itemError) throw itemError;

            // Delete existing recipes
            const { error: deleteError } = await supabase
                .from('recipes')
                .delete()
                .eq('menu_item_id', item.id);

            if (deleteError) throw deleteError;

            // Insert new recipes
            if (recipes.length > 0) {
                const recipeInserts = recipes.map(recipe => ({
                    menu_item_id: item.id,
                    inventory_item_id: recipe.inventoryItemId,
                    quantity: parseFloat(recipe.quantity),
                    unit: recipe.unit,
                }));

                const { error: recipeError } = await supabase
                    .from('recipes')
                    .insert(recipeInserts);

                if (recipeError) throw recipeError;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menu_items'] });
            queryClient.invalidateQueries({ queryKey: ['recipe_usage'] });
            onOpenChange(false);
            toast.success('Menu item updated successfully');
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
        if (!selectedInventoryItem) return;

        const inventoryItem = inventoryItems.find(i => i.id === selectedInventoryItem);
        if (!inventoryItem) return;

        if (recipes.some(r => r.inventoryItemId === selectedInventoryItem)) {
            toast.error('This ingredient is already added');
            return;
        }

        setRecipes([...recipes, {
            inventoryItemId: selectedInventoryItem,
            inventoryItemName: isRTL ? inventoryItem.name_ar : inventoryItem.name_en,
            quantity: '0.1',
            unit: inventoryItem.unit,
        }]);
        setSelectedInventoryItem('');
    };

    const removeRecipe = (inventoryItemId: string) => {
        setRecipes(recipes.filter(r => r.inventoryItemId !== inventoryItemId));
    };

    const updateRecipeQuantity = (inventoryItemId: string, quantity: string) => {
        setRecipes(recipes.map(r =>
            r.inventoryItemId === inventoryItemId ? { ...r, quantity } : r
        ));
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{isRTL ? 'تعديل الصنف' : 'Edit Menu Item'}</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-100px)] pr-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Names */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name_en">{isRTL ? 'الاسم بالإنجليزية' : 'Name (English)'}</Label>
                                <Input
                                    id="name_en"
                                    required
                                    value={formData.name_en}
                                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name_ar">{isRTL ? 'الاسم بالعربية' : 'Name (Arabic)'}</Label>
                                <Input
                                    id="name_ar"
                                    required
                                    value={formData.name_ar}
                                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    dir="rtl"
                                />
                            </div>
                        </div>

                        {/* Descriptions */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="description_en">{isRTL ? 'الوصف بالإنجليزية' : 'Description (English)'}</Label>
                                <Textarea
                                    id="description_en"
                                    value={formData.description_en}
                                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description_ar">{isRTL ? 'الوصف بالعربية' : 'Description (Arabic)'}</Label>
                                <Textarea
                                    id="description_ar"
                                    value={formData.description_ar}
                                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                                    dir="rtl"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Price & Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">{isRTL ? 'السعر' : 'Price'}</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{isRTL ? 'الفئة' : 'Category'}</Label>
                                <Select
                                    value={formData.category_id}
                                    onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={isRTL ? 'اختر الفئة' : 'Select category'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {isRTL ? cat.name_ar : cat.name_en}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                            <Label htmlFor="image_url">{isRTL ? 'رابط الصورة (اختياري)' : 'Image URL (Optional)'}</Label>
                            <Input
                                id="image_url"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            />
                        </div>

                        {/* Recipe Assignment */}
                        <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <ChefHat className="w-4 h-4" />
                                <Label>{isRTL ? 'المكونات المطلوبة (اختياري)' : 'Recipe Ingredients (Optional)'}</Label>
                            </div>

                            {recipes.length > 0 && (
                                <div className="space-y-2">
                                    {recipes.map((recipe) => (
                                        <div key={recipe.inventoryItemId} className="flex items-center gap-2">
                                            <Badge variant="secondary" className="flex-1">
                                                {recipe.inventoryItemName}
                                            </Badge>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={recipe.quantity}
                                                onChange={(e) => updateRecipeQuantity(recipe.inventoryItemId, e.target.value)}
                                                className="w-24"
                                            />
                                            <span className="text-sm text-muted-foreground w-8">{recipe.unit}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeRecipe(recipe.inventoryItemId)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Select value={selectedInventoryItem} onValueChange={setSelectedInventoryItem}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder={isRTL ? 'اختر مكون' : 'Select ingredient'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {inventoryItems
                                            .filter(i => !recipes.some(r => r.inventoryItemId === i.id))
                                            .map((i) => (
                                                <SelectItem key={i.id} value={i.id}>
                                                    {isRTL ? i.name_ar : i.name_en}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" onClick={addRecipe} disabled={!selectedInventoryItem}>
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

export default EditMenuItemDialog;
