import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, ArrowDown, ArrowUp, Warehouse, DollarSign, Minus, Plus, Search, Pencil } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import AddInventoryItemDialog from '@/components/inventory/AddInventoryItemDialog';
import EditInventoryItemDialog from '@/components/inventory/EditInventoryItemDialog';
import { useAdjustStock } from '@/hooks/useAdjustStock';
import { InventoryMovementHistory } from '@/components/inventory/InventoryMovementHistory';
import { RecipeUsage } from '@/components/inventory/RecipeUsage';

const Inventory = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [itemAdjustAmounts, setItemAdjustAmounts] = useState<Record<string, number>>({});
  const [pendingItems, setPendingItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const adjustStock = useAdjustStock();

  const { data: inventoryItems = [], isLoading } = useQuery({
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

  // Filter items by search
  const filteredItems = inventoryItems.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.name_en.toLowerCase().includes(searchLower) ||
      item.name_ar.toLowerCase().includes(searchLower)
    );
  });

  const lowStockItems = inventoryItems.filter(item => item.current_stock < item.minimum_stock);

  // Calculate total inventory value
  const totalInventoryValue = inventoryItems.reduce((sum, item) => {
    const costPerUnit = item.cost_per_unit || 0;
    return sum + (item.current_stock * costPerUnit);
  }, 0);

  const getStockPercentage = (current: number, minimum: number) => {
    if (minimum === 0) return 100;
    return Math.min((current / (minimum * 2)) * 100, 100);
  };

  const getStockStatus = (current: number, minimum: number) => {
    if (current < minimum) return 'critical';
    if (current < minimum * 1.5) return 'warning';
    return 'good';
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading inventory...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
        <div className="flex gap-2">
          <InventoryMovementHistory />
          <AddInventoryItemDialog />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="card-pos">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.rawMaterials')}</p>
                <p className="text-2xl font-bold">{inventoryItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos border-destructive/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.lowStock')}</p>
                <p className="text-2xl font-bold text-destructive">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.warehouses')}</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isRTL ? 'ابحث عن العناصر...' : 'Search items...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="card-pos">
        <CardHeader>
          <CardTitle>{t('inventory.rawMaterials')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? 'العنصر' : 'Item'}</TableHead>
                <TableHead>{t('inventory.stockLevel')}</TableHead>
                <TableHead>{t('inventory.minimum')}</TableHead>
                <TableHead>{t('tables.status')}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-4">
                      <span>{searchQuery ? 'No items found' : (isRTL ? 'لا يوجد عناصر في المخزون' : 'No items in inventory')}</span>
                      {!searchQuery && <AddInventoryItemDialog />}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const status = getStockStatus(item.current_stock, item.minimum_stock);
                  const percentage = getStockPercentage(item.current_stock, item.minimum_stock);

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {isRTL ? item.name_ar : item.name_en}
                        <RecipeUsage itemId={item.id} itemName={isRTL ? item.name_ar : item.name_en} />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 w-32">
                          <Progress
                            value={percentage}
                            className={cn(
                              'h-2',
                              status === 'critical' && '[&>div]:bg-destructive',
                              status === 'warning' && '[&>div]:bg-warning',
                              status === 'good' && '[&>div]:bg-success'
                            )}
                          />
                          <p className="text-sm">
                            {item.current_stock} {item.unit}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.minimum_stock} {item.unit}
                      </TableCell>
                      <TableCell>
                        {status === 'critical' && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {t('inventory.lowStock')}
                          </Badge>
                        )}
                        {status === 'warning' && (
                          <Badge className="bg-warning text-warning-foreground">
                            Warning
                          </Badge>
                        )}
                        {status === 'good' && (
                          <Badge className="bg-success text-success-foreground">
                            Good
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingItem(item);
                              setEditDialogOpen(true);
                            }}
                            title={isRTL ? 'تعديل' : 'Edit'}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <InventoryMovementHistory itemId={item.id} itemName={isRTL ? item.name_ar : item.name_en} />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              if (pendingItems.has(item.id)) return; // Prevent duplicate calls
                              setPendingItems(prev => new Set(prev).add(item.id));
                              const amount = itemAdjustAmounts[item.id] || 1;
                              adjustStock.mutate({
                                itemId: item.id,
                                quantity: -amount,
                                reason: `Manual decrease by ${amount}`
                              }, {
                                onSettled: () => {
                                  setPendingItems(prev => {
                                    const next = new Set(prev);
                                    next.delete(item.id);
                                    return next;
                                  });
                                }
                              });
                            }}
                            disabled={pendingItems.has(item.id) || item.current_stock <= 0}
                            title={`Decrease by ${itemAdjustAmounts[item.id] || 1} ${item.unit}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={itemAdjustAmounts[item.id] || 1}
                            onChange={(e) => setItemAdjustAmounts({ ...itemAdjustAmounts, [item.id]: parseFloat(e.target.value) || 1 })}
                            className="w-16 h-8 text-center"
                            placeholder="1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              if (pendingItems.has(item.id)) return; // Prevent duplicate calls
                              setPendingItems(prev => new Set(prev).add(item.id));
                              const amount = itemAdjustAmounts[item.id] || 1;
                              adjustStock.mutate({
                                itemId: item.id,
                                quantity: amount,
                                reason: `Manual increase by ${amount}`
                              }, {
                                onSettled: () => {
                                  setPendingItems(prev => {
                                    const next = new Set(prev);
                                    next.delete(item.id);
                                    return next;
                                  });
                                }
                              });
                            }}
                            disabled={pendingItems.has(item.id)}
                            title={`Increase by ${itemAdjustAmounts[item.id] || 1} ${item.unit}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditInventoryItemDialog
        item={editingItem}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingItem(null);
        }}
      />
    </motion.div>
  );
};

export default Inventory;
