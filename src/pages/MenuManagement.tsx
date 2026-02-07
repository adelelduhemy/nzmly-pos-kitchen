import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch categories from database
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
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

  // Fetch menu items from database (with category_id)
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ['menu_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, category:menu_categories(id, name_en, name_ar)')
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
      toast.success(t('menu.availabilityUpdated'));
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
      toast.success(t('menu.itemDeleted'));
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async ({ nameEn, nameAr }: { nameEn: string; nameAr: string }) => {
      const { error } = await supabase
        .from('menu_categories')
        .insert({ name_en: nameEn, name_ar: nameAr });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_categories'] });
      toast.success(t('menu.categoryAdded'));
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Edit category mutation
  const editCategoryMutation = useMutation({
    mutationFn: async ({ id, nameEn, nameAr }: { id: string; nameEn: string; nameAr: string }) => {
      const { error } = await supabase
        .from('menu_categories')
        .update({ name_en: nameEn, name_ar: nameAr })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_categories'] });
      toast.success(t('menu.categoryUpdated'));
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      // Check if category has items
      const category = categories.find(c => c.id === categoryId);
      const hasItems = items.some((i) => i.category === category?.name_en);
      if (hasItems) {
        throw new Error(isRTL ? 'لا يمكن حذف تصنيف يحتوي على عناصر' : 'Cannot delete category that has items. Move or delete items first.');
      }
      
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_categories'] });
      toast.success(t('menu.categoryDeleted'));
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Get selected category name for header
  const selectedCategoryName = selectedCategory
    ? selectedCategory === '__uncategorized__'
      ? (isRTL ? 'غير مصنف' : 'Uncategorized')
      : categories.find(c => c.id === selectedCategory)?.[isRTL ? 'name_ar' : 'name_en'] || ''
    : null;

  const filteredItems = selectedCategory
    ? selectedCategory === '__uncategorized__'
      ? items.filter((item) => !item.category_id)
      : items.filter((item) => item.category_id === selectedCategory)
    : items;

  const isLoading = categoriesLoading || itemsLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {selectedCategoryName || t('nav.menu')}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setAddCategoryOpen(true)}>
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
                <span className="font-medium">{t('menu.allItems')}</span>
                <Badge variant="secondary">{items.length}</Badge>
              </button>
              {categories.map((category) => {
                const itemCount = items.filter((i) => i.category_id === category.id).length;
                return (
                  <div
                    key={category.id}
                    className={cn(
                      'w-full flex items-center justify-between p-3 hover:bg-muted transition-colors',
                      selectedCategory === category.id && 'bg-muted'
                    )}
                  >
                    <button
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span className="font-medium">
                        {isRTL ? category.name_ar : category.name_en}
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{itemCount}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(category);
                          setEditCategoryOpen(true);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-8 text-destructive"
                        disabled={itemCount > 0}
                        title={itemCount > 0 ? (isRTL ? 'يجب نقل أو حذف العناصر أولاً' : 'Must move or delete items first') : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(t('menu.confirmDeleteCategory'))) {
                            deleteCategoryMutation.mutate(category.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {/* Uncategorized items section */}
              {(() => {
                const uncategorizedCount = items.filter((i) => !i.category_id).length;
                if (uncategorizedCount === 0) return null;
                return (
                  <button
                    onClick={() => setSelectedCategory('__uncategorized__')}
                    className={cn(
                      'w-full flex items-center justify-between p-3 hover:bg-muted transition-colors',
                      selectedCategory === '__uncategorized__' && 'bg-muted'
                    )}
                  >
                    <span className="font-medium">
                      {isRTL ? 'غير مصنف' : 'Uncategorized'}
                    </span>
                    <Badge variant="secondary">{uncategorizedCount}</Badge>
                  </button>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Menu Items Grid */}
        <div className="lg:col-span-3 space-y-4">
          {categoriesError || itemsError ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-destructive">{t('common.error')}</span>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-muted-foreground">{t('common.loading')}</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-muted-foreground">{t('menu.noItemsInCategory')}</span>
            </div>
          ) : (
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
                      <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name_en} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">🍽️</span>
                        )}
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
                          disabled={toggleAvailabilityMutation.isPending && toggleAvailabilityMutation.variables?.itemId === item.id}
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
                              if (confirm(t('menu.confirmDeleteItem'))) {
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
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddMenuItemDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <EditMenuItemDialog item={editingItem} open={editDialogOpen} onOpenChange={setEditDialogOpen} />

      {/* Category Dialogs */}
      <AddCategoryDialog />
      <EditCategoryDialog />
    </motion.div>
  );

  function AddCategoryDialog() {
    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!nameEn.trim()) return;
      addCategoryMutation.mutate({ nameEn: nameEn.trim(), nameAr: nameAr.trim() || nameEn.trim() });
      setNameEn('');
      setNameAr('');
      setAddCategoryOpen(false);
    };

    return (
      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('menu.addNewCategory')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="category-en">{t('menu.nameEn')}</Label>
              <Input
                id="category-en"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder={t('menu.placeholderEn')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-ar">{t('menu.nameAr')}</Label>
              <Input
                id="category-ar"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={t('menu.placeholderAr')}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={() => setAddCategoryOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={addCategoryMutation.isPending}>
                {addCategoryMutation.isPending ? t('menu.adding') : t('common.add')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  function EditCategoryDialog() {
    const [nameEn, setNameEn] = useState(editingCategory?.name_en || '');
    const [nameAr, setNameAr] = useState(editingCategory?.name_ar || '');

    React.useEffect(() => {
      setNameEn(editingCategory?.name_en || '');
      setNameAr(editingCategory?.name_ar || '');
    }, [editingCategory]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingCategory || !nameEn.trim()) return;
      editCategoryMutation.mutate({ 
        id: editingCategory.id, 
        nameEn: nameEn.trim(), 
        nameAr: nameAr.trim() || nameEn.trim() 
      });
      setEditCategoryOpen(false);
      setEditingCategory(null);
    };

    return (
      <Dialog open={editCategoryOpen} onOpenChange={setEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('menu.editCategoryTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-en">{t('menu.nameEn')}</Label>
              <Input
                id="edit-category-en"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder={t('menu.placeholderEn')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-ar">{t('menu.nameAr')}</Label>
              <Input
                id="edit-category-ar"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={t('menu.placeholderAr')}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={() => {
                setEditCategoryOpen(false);
                setEditingCategory(null);
              }}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={editCategoryMutation.isPending}>
                {editCategoryMutation.isPending ? t('menu.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
};

export default MenuManagement;
