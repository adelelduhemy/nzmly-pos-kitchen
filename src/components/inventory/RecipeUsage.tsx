import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ChefHat, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RecipeUsageProps {
    itemId: string;
    itemName: string;
}

interface RecipeWithMenuItem {
    id: string;
    inventory_item_id: string;
    menu_item_id: string;
    quantity: number;
    unit: string;
    menu_items?: {
        name_en: string;
        name_ar: string;
        price: number;
        category: string;
    };
}

export const RecipeUsage: React.FC<RecipeUsageProps> = ({ itemId, itemName }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [open, setOpen] = useState(false);

    const { data: recipes = [], isLoading } = useQuery({
        queryKey: ['recipe_usage', itemId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('recipes')
                .select(`
          *,
          menu_items(name_en, name_ar, price, category)
        `)
                .eq('inventory_item_id', itemId);

            if (error) throw error;
            return data;
        },
        enabled: open,
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Info className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ChefHat className="w-5 h-5" />
                        {isRTL ? 'الوصفات التي تستخدم' : 'Recipes Using'} "{itemName}"
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[400px] pr-4">
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : recipes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {isRTL ? 'لا توجد وصفات تستخدم هذا العنصر' : 'No recipes use this ingredient'}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground mb-4">
                                {isRTL
                                    ? `هذا المكون يُستخدم في ${recipes.length} وصفة`
                                    : `This ingredient is used in ${recipes.length} recipe${recipes.length > 1 ? 's' : ''}`
                                }
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <p className="text-sm font-medium text-blue-900">
                                    💡 {isRTL ? 'عند طلب هذه الأطباق، سيتم خصم الكميات التالية تلقائياً' : 'When these dishes are ordered, the following amounts are automatically deducted'}
                                </p>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{isRTL ? 'الطبق' : 'Menu Item'}</TableHead>
                                        <TableHead>{isRTL ? 'الفئة' : 'Category'}</TableHead>
                                        <TableHead className="text-center">{isRTL ? 'الكمية المخصومة' : 'Amount Deducted'}</TableHead>
                                        <TableHead>{isRTL ? 'السعر' : 'Price'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recipes.map((recipe: RecipeWithMenuItem) => (
                                        <TableRow key={recipe.id}>
                                            <TableCell className="font-medium">
                                                {isRTL ? recipe.menu_items?.name_ar : recipe.menu_items?.name_en}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {recipe.menu_items?.category || '-'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="font-bold text-lg text-red-600">
                                                        -{recipe.quantity} {recipe.unit}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {isRTL ? 'لكل طلب' : 'per order'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                ${recipe.menu_items?.price?.toFixed(2) || '0.00'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
