import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, ArrowDown, ArrowUp, Warehouse } from 'lucide-react';
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
import { mockInventoryItems, getLowStockItems } from '@/data/mockData';

const Inventory = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const lowStockItems = getLowStockItems();

  const getStockPercentage = (current: number, minimum: number) => {
    return Math.min((current / (minimum * 2)) * 100, 100);
  };

  const getStockStatus = (current: number, minimum: number) => {
    if (current < minimum) return 'critical';
    if (current < minimum * 1.5) return 'warning';
    return 'good';
  };

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
          <Button variant="outline" className="gap-2">
            <ArrowDown className="w-4 h-4" />
            Stock In
          </Button>
          <Button variant="outline" className="gap-2">
            <ArrowUp className="w-4 h-4" />
            Stock Out
          </Button>
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
                <p className="text-2xl font-bold">{mockInventoryItems.length}</p>
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
                <TableHead>Item</TableHead>
                <TableHead>{t('inventory.stockLevel')}</TableHead>
                <TableHead>{t('inventory.minimum')}</TableHead>
                <TableHead>{t('tables.status')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInventoryItems.map((item) => {
                const status = getStockStatus(item.currentStock, item.minimumStock);
                const percentage = getStockPercentage(item.currentStock, item.minimumStock);

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
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
                          {item.currentStock} {item.unit}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.minimumStock} {item.unit}
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
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Inventory;
