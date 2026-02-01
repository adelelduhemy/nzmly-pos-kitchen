
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, ChefHat } from 'lucide-react';
import { toast } from 'sonner';

interface RecipeDialogProps {
    menuItemId: string;
    menuItemName: string;
}

const RecipeDialog: React.FC<RecipeDialogProps> = ({ menuItemId, menuItemName }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const queryClient = useQueryClient();
    const [selectedIngredient, setSelectedIngredient] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');

    // Fetch linked recipes (ingredients)
    const { data: recipes = [] } = useQuery({
        queryKey: ['recipes', menuItemId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('recipes')
                .select(`
          *,
          inventory_items (
            id,
            name_en,
            name_ar,
            unit,
            current_stock,
            cost_per_unit
          )
        `)
                .eq('menu_item_id', menuItemId);

            if (error) throw error;
            return data;
        },
    });

    // Fetch available inventory items
    const { data: inventoryItems = [] } = useQuery({
        queryKey: ['inventory_items'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*')
                .order('name_en');
            if (error) throw error;
            return data;
        },
    });

    // Add Recipe Mutation
    const addRecipeMutation = useMutation({
        mutationFn: async () => {
            if (!selectedIngredient || !quantity) return;

            const { error } = await supabase
                .from('recipes')
                .insert({
                    menu_item_id: menuItemId,
                    inventory_item_id: selectedIngredient,
                    quantity: parseFloat(quantity)
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes', menuItemId] });
            setSelectedIngredient('');
            setQuantity('');
            toast.success(isRTL ? 'تم إضافة المكون' : 'Ingredient added successfully');
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    // Delete Recipe Mutation
    const deleteRecipeMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes', menuItemId] });
            toast.success(isRTL ? 'تم حذف المكون' : 'Ingredient removed');
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    // Calculate total cost
    const totalCost = recipes.reduce((sum, recipe) => {
        const cost = recipe.inventory_items?.cost_per_unit || 0;
        return sum + (cost * recipe.quantity);
    }, 0);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" title={isRTL ? 'إدارة الوصفة' : 'Manage Recipe'}>
                    <ChefHat className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isRTL ? `وصفة: ${menuItemName}` : `Recipe: ${menuItemName}`}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Add Ingredient Form */}
                    <div className="flex gap-4 items-end bg-muted/30 p-4 rounded-lg">
                        <div className="flex-1 space-y-2">
                            <Label>{isRTL ? 'المكون' : 'Ingredient'}</Label>
                            <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isRTL ? 'اختر مكون...' : 'Select ingredient...'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {inventoryItems.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {isRTL ? item.name_ar : item.name_en} ({item.unit}) - {item.cost_per_unit} {t('common.currency')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-32 space-y-2">
                            <Label>{isRTL ? 'الكمية' : 'Quantity'}</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <Button onClick={() => addRecipeMutation.mutate()} disabled={!selectedIngredient || !quantity}>
                            <Plus className="w-4 h-4 mr-2" />
                            {isRTL ? 'إضافة' : 'Add'}
                        </Button>
                    </div>

                    {/* Ingredients Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">{isRTL ? 'المكون' : 'Ingredient'}</TableHead>
                                    <TableHead className="text-right">{isRTL ? 'الكمية' : 'Quantity'}</TableHead>
                                    <TableHead className="text-right">{isRTL ? 'التكلفة التقديرية' : 'Est. Cost'}</TableHead>
                                    <TableHead w-12></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recipes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            {isRTL ? 'لا يوجد مكونات مضافة' : 'No ingredients added yet'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    recipes.map((recipe) => (
                                        <TableRow key={recipe.id}>
                                            <TableCell>
                                                {isRTL ? recipe.inventory_items?.name_ar : recipe.inventory_items?.name_en}
                                            </TableCell>
                                            <TableCell>
                                                {recipe.quantity} {recipe.inventory_items?.unit}
                                            </TableCell>
                                            <TableCell>
                                                {((recipe.inventory_items?.cost_per_unit || 0) * recipe.quantity).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive h-8 w-8"
                                                    onClick={() => deleteRecipeMutation.mutate(recipe.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                {recipes.length > 0 && (
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell colSpan={2}>{isRTL ? 'إجمالي التكلفة' : 'Total Cost'}</TableCell>
                                        <TableCell>{totalCost.toFixed(2)}</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RecipeDialog;
