import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, GripVertical, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatCurrency';
import { toast } from 'sonner';
import AddMenuItemDialog from '@/components/menu/AddMenuItemDialog';
import EditMenuItemDialog from '@/components/menu/EditMenuItemDialog';

const MenuManagement = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch categories from database
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
  });

  // Fetch menu items from database
  const { data: items = [] } = useQuery({
    queryKey: ['menu_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name_en');
      if (error) throw error;
      return data;
    },
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) => {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: isAvailable })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
      toast.success('Availability updated');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // Delete recipes first (foreign key constraint)
      await supabase.from('recipes').delete().eq('menu_item_id', itemId);

      // Delete the menu item
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
      toast.success('Menu item deleted');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('nav.menu')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            {t('menu.addCategory')}
          </Button>
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            {t('menu.addItem')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <Card className="card-pos lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{t('menu.categories')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'w-full flex items-center justify-between p-3 hover:bg-muted transition-colors',
                  !selectedCategory && 'bg-muted'
                )}
              >
                <span className="font-medium">{t('orders.allOrders')}</span>
                <Badge variant="secondary">{items.length}</Badge>
              </button>
              {categories.map((category) => {
                const itemCount = items.filter((i) => i.category === category.name_en).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 hover:bg-muted transition-colors',
                      selectedCategory === category.id && 'bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <span className="font-medium">
                        {isRTL ? category.name_ar : category.name_en}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{itemCount}</Badge>
                      <ChevronRight className={cn('w-4 h-4 text-muted-foreground', isRTL && 'rotate-180')} />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Menu Items Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="card-pos h-full">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <span className="text-3xl">🍽️</span>
                      </div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold line-clamp-1">
                            {isRTL ? item.name_ar : item.name_en}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {isRTL ? item.description_ar : item.description_en}
                          </p>
                        </div>
                        <Switch
                          checked={item.is_available}
                          onCheckedChange={(checked) => {
                            toggleAvailabilityMutation.mutate({
                              itemId: item.id,
                              isAvailable: checked
                            });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-primary">
                          {formatCurrency(item.price, i18n.language)}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingItem(item);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا الصنف?' : 'Are you sure you want to delete this item?')) {
                                deleteItemMutation.mutate(item.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddMenuItemDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <EditMenuItemDialog item={editingItem} open={editDialogOpen} onOpenChange={setEditDialogOpen} />
    </motion.div>
  );
};

export default MenuManagement;
