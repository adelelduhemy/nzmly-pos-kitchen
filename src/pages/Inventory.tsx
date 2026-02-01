import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, ArrowDown, ArrowUp, Warehouse } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

const Inventory = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

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

  const lowStockItems = inventoryItems.filter(item => item.current_stock < item.minimum_stock);

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
          <AddInventoryItemDialog />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-4">
                      <span>{isRTL ? 'لا يوجد عناصر في المخزون' : 'No items in inventory'}</span>
                      <AddInventoryItemDialog />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                inventoryItems.map((item) => {
                  const status = getStockStatus(item.current_stock, item.minimum_stock);
                  const percentage = getStockPercentage(item.current_stock, item.minimum_stock);

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {isRTL ? item.name_ar : item.name_en}
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
                        <Button variant="outline" size="sm">
                          {isRTL ? 'تحديث' : 'Update'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Inventory;
