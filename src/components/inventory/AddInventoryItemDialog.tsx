
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient, useMutation } from '@tanstack/react-query';
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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

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

            const { error } = await supabase.from('inventory_items').insert({
                warehouse_id: warehouseData.id,
                name_en: formData.name_en,
                name_ar: formData.name_ar,
                unit: formData.unit,
                current_stock: parseFloat(formData.current_stock) || 0,
                minimum_stock: parseFloat(formData.minimum_stock) || 0,
                cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
            setOpen(false);
            setFormData({
                name_en: '',
                name_ar: '',
                unit: 'kg',
                current_stock: '',
                minimum_stock: '',
                cost_per_unit: '',
            });
            toast.success(isRTL ? 'تم إضافة العنصر' : 'Item added successfully');
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createItemMutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('inventory.addItem', 'Add Item')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('inventory.addItem', 'Add New Inventory Item')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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

                    <Button type="submit" className="w-full" disabled={createItemMutation.isPending}>
                        {createItemMutation.isPending ? 'Saving...' : (isRTL ? 'حفظ' : 'Save Item')}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddInventoryItemDialog;
