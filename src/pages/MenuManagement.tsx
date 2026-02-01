import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, GripVertical, ChevronRight } from 'lucide-react';
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
import { mockCategories, mockMenuItems } from '@/data/mockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { MenuCategory, MenuItem } from '@/types';

const MenuManagement = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories] = useState(mockCategories);
  const [items] = useState(mockMenuItems);

  const filteredItems = selectedCategory
    ? items.filter((item) => item.categoryId === selectedCategory)
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
          <Button className="gap-2">
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
                const itemCount = items.filter((i) => i.categoryId === category.id).length;
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
                        {isRTL ? category.nameAr : category.nameEn}
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
                            {isRTL ? item.nameAr : item.nameEn}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {isRTL ? item.descriptionAr : item.descriptionEn}
                          </p>
                        </div>
                        <Switch checked={item.isActive} />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-primary">
                          {formatCurrency(item.basePrice, i18n.language)}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {(item.variants.length > 0 || item.modifiers.length > 0) && (
                        <div className="flex gap-2 mt-2 pt-2 border-t">
                          {item.variants.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {item.variants.length} {t('menu.variants')}
                            </Badge>
                          )}
                          {item.modifiers.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {item.modifiers.length} {t('menu.modifiers')}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuManagement;
