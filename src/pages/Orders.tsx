import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, X, Clock, Check, ChefHat, Truck, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { mockOrders, mockTables } from '@/data/mockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { Order, OrderStatus, OrderType } from '@/types';

const Orders = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders =
    statusFilter === 'all'
      ? mockOrders
      : mockOrders.filter((o) => o.status === statusFilter);

  const getStatusBadge = (status: OrderStatus) => {
    const config: Record<OrderStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      pending: { variant: 'secondary', className: 'bg-muted' },
      confirmed: { variant: 'default', className: 'bg-primary' },
      preparing: { variant: 'default', className: 'bg-warning text-warning-foreground' },
      ready: { variant: 'default', className: 'bg-success text-success-foreground' },
      served: { variant: 'secondary', className: 'bg-muted' },
      paid: { variant: 'default', className: 'bg-success text-success-foreground' },
      cancelled: { variant: 'destructive', className: '' },
    };
    return config[status];
  };

  const getOrderTypeIcon = (type: OrderType) => {
    switch (type) {
      case 'dine-in':
        return <ChefHat className="w-4 h-4" />;
      case 'takeaway':
        return <ShoppingBag className="w-4 h-4" />;
      case 'delivery':
        return <Truck className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const statusFilters: (OrderStatus | 'all')[] = [
    'all',
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'paid',
    'cancelled',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <h1 className="text-2xl font-bold">{t('orders.title')}</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t('common.search')} className="pl-9 w-64" />
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? t('orders.allOrders') : t(`orders.${status}`)}
            <Badge variant="secondary" className="ml-2">
              {status === 'all'
                ? mockOrders.length
                : mockOrders.filter((o) => o.status === status).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Orders Table */}
      <Card className="card-pos">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('kds.orderNumber')}</TableHead>
                <TableHead>{t('pos.type')}</TableHead>
                <TableHead>{t('tables.title')}</TableHead>
                <TableHead>{t('common.total')}</TableHead>
                <TableHead>{t('tables.status')}</TableHead>
                <TableHead>{t('common.time')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const table = mockTables.find((t) => t.id === order.tableId);
                const statusBadge = getStatusBadge(order.status);

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getOrderTypeIcon(order.type)}
                        <span className="capitalize">{order.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{table?.number || '-'}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(order.total, i18n.language)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(statusBadge.className)}>
                        {t(`orders.${order.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(order.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('orders.orderDetails')}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('kds.orderNumber')}</p>
                  <p className="font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('tables.status')}</p>
                  <Badge className={cn(getStatusBadge(selectedOrder.status).className)}>
                    {t(`orders.${selectedOrder.status}`)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('pos.type')}</p>
                  <p className="font-medium capitalize">{selectedOrder.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.total')}</p>
                  <p className="font-bold text-primary">
                    {formatCurrency(selectedOrder.total, i18n.language)}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={['paid', 'cancelled'].includes(selectedOrder.status)}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('orders.cancelOrder')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Orders;
