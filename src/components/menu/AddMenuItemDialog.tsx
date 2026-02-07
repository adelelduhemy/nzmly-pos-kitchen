import React, { useState } from 'react';
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

interface AddMenuItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AddMenuItemDialog = ({ open, onOpenChange }: AddMenuItemDialogProps) => {
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

    const addItemMutation = useMutation({
        mutationFn: async () => {
            // Insert menu item
            const { data: newItem, error: itemError } = await supabase
                .from('menu_items')
                .insert({
                    name_en: formData.name_en,
                    name_ar: formData.name_ar,
                    description_en: formData.description_en,
                    description_ar: formData.description_ar,
                    price: parseFloat(formData.price) || 0,
                    category_id: formData.category_id,
                    image_url: formData.image_url || null,
                    is_available: true,
                    is_featured: false,
                })
                .select()
                .single();

            if (itemError) throw itemError;

            // Insert recipes if any
            if (recipes.length > 0 && newItem) {
                const recipeInserts = recipes.map(recipe => ({
                    menu_item_id: newItem.id,
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
            resetForm();
            onOpenChange(false);
            toast.success('Menu item added successfully');
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const resetForm = () => {
        setFormData({
            name_en: '',
            name_ar: '',
            description_en: '',
            description_ar: '',
            price: '',
            category_id: '',
            image_url: '',
        });
        setRecipes([]);
        setSelectedInventoryItem('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addItemMutation.mutate();
    };

    const addRecipe = () => {
        if (!selectedInventoryItem) return;

        const inventoryItem = inventoryItems.find(item => item.id === selectedInventoryItem);
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{isRTL ? 'إضافة صنف جديد' : 'Add Menu Item'}</DialogTitle>
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
                                    placeholder="Margherita Pizza"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name_ar">{isRTL ? 'الاسم بالعربية' : 'Name (Arabic)'}</Label>
                                <Input
                                    id="name_ar"
                                    required
                                    value={formData.name_ar}
                                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    placeholder="بيتزا مارجريتا"
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
                                    placeholder="Fresh mozzarella, tomato sauce, basil"
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description_ar">{isRTL ? 'الوصف بالعربية' : 'Description (Arabic)'}</Label>
                                <Textarea
                                    id="description_ar"
                                    value={formData.description_ar}
                                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                                    placeholder="موتزاريلا طازجة، صلصة طماطم، ريحان"
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
                                    placeholder="25.00"
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
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        {/* Recipe Assignment */}
                        <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <ChefHat className="w-4 h-4" />
                                <Label>{isRTL ? 'المكونات المطلوبة (اختياري)' : 'Recipe Ingredients (Optional)'}</Label>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                {isRTL
                                    ? 'حدد المكونات التي سيتم خصمها من المخزون عند طلب هذا الصنف'
                                    : 'Select ingredients to be deducted from inventory when this item is ordered'
                                }
                            </p>

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
                                            .filter(item => !recipes.some(r => r.inventoryItemId === item.id))
                                            .map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {isRTL ? item.name_ar : item.name_en}
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
                            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
                                {isRTL ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button type="submit" disabled={addItemMutation.isPending}>
                                {addItemMutation.isPending
                                    ? (isRTL ? 'جاري الإضافة...' : 'Adding...')
                                    : (isRTL ? 'إضافة' : 'Add')}
                            </Button>
                        </div>
                    </form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default AddMenuItemDialog;
