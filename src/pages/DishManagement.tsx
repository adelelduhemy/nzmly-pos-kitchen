import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UtensilsCrossed, 
  Plus, 
  Edit,
  Trash2,
  X,
  Package,
  Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Dish {
  id: string;
  name_en: string;
  name_ar: string;
  description: string | null;
  is_active: boolean;
}

interface InventoryItem {
  id: string;
  name_en: string;
  name_ar: string;
  unit: string;
  warehouse_id: string;
}

interface DishIngredient {
  id: string;
  dish_id: string;
  inventory_item_id: string;
  quantity_consumed: number;
  inventory_item?: InventoryItem;
}

interface IngredientForm {
  inventory_item_id: string;
  quantity_consumed: number;
}

const DishManagement = () => {
  const { t, i18n } = useTranslation();
  const { isOwnerOrManager } = useAuthContext();
  const isRTL = i18n.language === 'ar';
  
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [rawMaterials, setRawMaterials] = useState<InventoryItem[]>([]);
  const [dishIngredients, setDishIngredients] = useState<DishIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showDishDialog, setShowDishDialog] = useState(false);
  const [showIngredientsDialog, setShowIngredientsDialog] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  
  // Form states
  const [dishForm, setDishForm] = useState({
    name_en: '',
    name_ar: '',
    description: '',
  });
  
  const [ingredients, setIngredients] = useState<IngredientForm[]>([]);

  useEffect(() => {
    fetchDishes();
    fetchRawMaterials();
  }, []);

  const fetchDishes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('فشل في تحميل الأطباق');
      setLoading(false);
      return;
    }
    setDishes(data as Dish[]);
    setLoading(false);
  };

  const fetchRawMaterials = async () => {
    // First get raw materials warehouse
    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id')
      .eq('type', 'raw_materials')
      .eq('is_active', true);
    
    if (!warehouses || warehouses.length === 0) return;
    
    const warehouseIds = warehouses.map(w => w.id);
    
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .in('warehouse_id', warehouseIds)
      .eq('is_active', true);
    
    if (error) {
      toast.error('فشل في تحميل المواد الخام');
      return;
    }
    setRawMaterials(data as InventoryItem[]);
  };

  const fetchDishIngredients = async (dishId: string) => {
    const { data, error } = await supabase
      .from('dish_ingredients')
      .select(`
        *,
        inventory_items (
          id,
          name_en,
          name_ar,
          unit,
          warehouse_id
        )
      `)
      .eq('dish_id', dishId);
    
    if (error) {
      toast.error('فشل في تحميل مكونات الطبق');
      return;
    }
    
    const formattedData = (data || []).map(item => ({
      id: item.id,
      dish_id: item.dish_id,
      inventory_item_id: item.inventory_item_id,
      quantity_consumed: item.quantity_consumed,
      inventory_item: item.inventory_items as unknown as InventoryItem
    }));
    
    setDishIngredients(formattedData);
    setIngredients(formattedData.map(d => ({
      inventory_item_id: d.inventory_item_id,
      quantity_consumed: d.quantity_consumed
    })));
  };

  const handleSaveDish = async () => {
    if (!dishForm.name_ar) {
      toast.error('يرجى إدخال اسم الطبق');
      return;
    }

    if (editingDish) {
      const { error } = await supabase
        .from('dishes')
        .update({
          name_en: dishForm.name_en,
          name_ar: dishForm.name_ar,
          description: dishForm.description || null,
        })
        .eq('id', editingDish.id);

      if (error) {
        toast.error('فشل في تحديث الطبق');
        return;
      }
      toast.success('تم تحديث الطبق بنجاح');
    } else {
      const { error } = await supabase
        .from('dishes')
        .insert({
          name_en: dishForm.name_en,
          name_ar: dishForm.name_ar,
          description: dishForm.description || null,
        });

      if (error) {
        toast.error('فشل في إضافة الطبق');
        return;
      }
      toast.success('تم إضافة الطبق بنجاح');
    }

    setShowDishDialog(false);
    setEditingDish(null);
    resetDishForm();
    fetchDishes();
  };

  const handleDeleteDish = async (dishId: string) => {
    const { error } = await supabase
      .from('dishes')
      .update({ is_active: false })
      .eq('id', dishId);

    if (error) {
      toast.error('فشل في حذف الطبق');
      return;
    }
    toast.success('تم حذف الطبق بنجاح');
    fetchDishes();
  };

  const handleOpenIngredients = async (dish: Dish) => {
    setSelectedDish(dish);
    await fetchDishIngredients(dish.id);
    setShowIngredientsDialog(true);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { inventory_item_id: '', quantity_consumed: 0 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof IngredientForm, value: string | number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSaveIngredients = async () => {
    if (!selectedDish) return;

    // Validate ingredients
    const validIngredients = ingredients.filter(
      ing => ing.inventory_item_id && ing.quantity_consumed > 0
    );

    if (validIngredients.length === 0) {
      toast.error('يرجى إضافة مكون واحد على الأقل');
      return;
    }

    // Check for duplicates
    const uniqueItems = new Set(validIngredients.map(i => i.inventory_item_id));
    if (uniqueItems.size !== validIngredients.length) {
      toast.error('لا يمكن تكرار نفس المادة الخام');
      return;
    }

    // Delete existing ingredients
    await supabase
      .from('dish_ingredients')
      .delete()
      .eq('dish_id', selectedDish.id);

    // Insert new ingredients
    const { error } = await supabase
      .from('dish_ingredients')
      .insert(
        validIngredients.map(ing => ({
          dish_id: selectedDish.id,
          inventory_item_id: ing.inventory_item_id,
          quantity_consumed: ing.quantity_consumed,
        }))
      );

    if (error) {
      toast.error('فشل في حفظ المكونات');
      return;
    }

    toast.success('تم حفظ مكونات الطبق بنجاح');
    setShowIngredientsDialog(false);
    setSelectedDish(null);
    setIngredients([]);
  };

  const resetDishForm = () => {
    setDishForm({
      name_en: '',
      name_ar: '',
      description: '',
    });
  };

  const openEditDialog = (dish: Dish) => {
    setEditingDish(dish);
    setDishForm({
      name_en: dish.name_en,
      name_ar: dish.name_ar,
      description: dish.description || '',
    });
    setShowDishDialog(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('dishes.title')}</h1>
          <p className="text-muted-foreground">{t('dishes.subtitle')}</p>
        </div>
        {isOwnerOrManager() && (
          <Button 
            className="gap-2"
            onClick={() => {
              resetDishForm();
              setEditingDish(null);
              setShowDishDialog(true);
            }}
          >
            <Plus className="w-4 h-4" />
            {t('dishes.addDish')}
          </Button>
        )}
      </div>

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              {t('common.loading')}
            </CardContent>
          </Card>
        ) : dishes.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t('dishes.noDishes')}</p>
            </CardContent>
          </Card>
        ) : (
          dishes.map((dish) => (
            <motion.div
              key={dish.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="card-pos hover:shadow-lg transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{dish.name_ar}</CardTitle>
                      {dish.name_en && (
                        <p className="text-sm text-muted-foreground">{dish.name_en}</p>
                      )}
                    </div>
                    <Badge variant="outline">
                      <UtensilsCrossed className="w-3 h-3 me-1" />
                      {t('dishes.dish')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dish.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {dish.description}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleOpenIngredients(dish)}
                    >
                      <Package className="w-4 h-4" />
                      {t('dishes.ingredients')}
                    </Button>
                    {isOwnerOrManager() && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(dish)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDish(dish.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Dish Dialog */}
      <Dialog open={showDishDialog} onOpenChange={setShowDishDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDish ? t('dishes.editDish') : t('dishes.addDish')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('dishes.nameAr')} *</Label>
              <Input
                value={dishForm.name_ar}
                onChange={(e) => setDishForm({ ...dishForm, name_ar: e.target.value })}
                placeholder="مثال: برجر لحم"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dishes.nameEn')}</Label>
              <Input
                value={dishForm.name_en}
                onChange={(e) => setDishForm({ ...dishForm, name_en: e.target.value })}
                placeholder="e.g. Beef Burger"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dishes.description')}</Label>
              <Textarea
                value={dishForm.description}
                onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                placeholder="وصف الطبق..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDishDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveDish}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ingredients Dialog */}
      <Dialog open={showIngredientsDialog} onOpenChange={setShowIngredientsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t('dishes.ingredientsFor')} {selectedDish?.name_ar}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {ingredients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('dishes.noIngredients')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dishes.rawMaterial')}</TableHead>
                    <TableHead>{t('dishes.quantityConsumed')}</TableHead>
                    <TableHead>{t('dishes.unit')}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredients.map((ing, index) => {
                    const material = rawMaterials.find(m => m.id === ing.inventory_item_id);
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={ing.inventory_item_id}
                            onValueChange={(value) => handleIngredientChange(index, 'inventory_item_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('dishes.selectMaterial')} />
                            </SelectTrigger>
                            <SelectContent>
                              {rawMaterials.map((mat) => (
                                <SelectItem key={mat.id} value={mat.id}>
                                  {mat.name_ar}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ing.quantity_consumed}
                            onChange={(e) => handleIngredientChange(index, 'quantity_consumed', parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {material?.unit || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveIngredient(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleAddIngredient}
            >
              <Plus className="w-4 h-4" />
              {t('dishes.addIngredient')}
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIngredientsDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveIngredients} className="gap-2">
              <Save className="w-4 h-4" />
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default DishManagement;
