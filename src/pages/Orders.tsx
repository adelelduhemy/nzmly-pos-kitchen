import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Search,
  Eye,
  X,
  Clock,
  Check,
  ChefHat,
  Truck,
  ShoppingBag,
  Printer,
  Calendar,
} from 'lucide-react';
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
import { formatCurrency } from '@/utils/formatCurrency';
import { useOrderHistory, useOrderStats, OrderHistoryItem } from '@/hooks/useOrderHistory';
import { useUpdateOrderStatus } from '@/hooks/useUpdateOrderStatus';
import { useUpdateWorkflowStatus } from '@/hooks/useUpdateWorkflowStatus';
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'completed' | 'cancelled';
type OrderType = 'dine-in' | 'takeaway' | 'delivery';

const Orders = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const updateOrderStatus = useUpdateOrderStatus();
  const updateWorkflowStatus = useUpdateWorkflowStatus();

  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'paid' | 'unpaid' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('all');

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return { startDate: startOfDay(now), endDate: endOfDay(now) };
      case 'yesterday':
        return { startDate: startOfDay(subDays(now, 1)), endDate: endOfDay(subDays(now, 1)) };
      case 'week':
        return { startDate: startOfWeek(now), endDate: endOfDay(now) };
      case 'month':
        return { startDate: startOfMonth(now), endDate: endOfDay(now) };
      default:
        return { startDate: null, endDate: null };
    }
  };

  const { startDate, endDate } = getDateRange();

  // Fetch orders with filters
  const { data: orders = [], isLoading } = useOrderHistory({
    searchQuery,
    statusFilter: statusFilter === 'all' ? undefined : statusFilter,
    startDate,
    endDate,
  });

  // Fetch statistics
  const { data: stats } = useOrderStats(startDate, endDate);

  const getStatusBadge = (status: OrderStatus) => {
    const config: Record<
      OrderStatus,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
    > = {
      pending: { variant: 'secondary', className: 'bg-yellow-600 text-white' },
      preparing: { variant: 'default', className: 'bg-orange-600 text-white' },
      ready: { variant: 'default', className: 'bg-green-600 text-white' },
      served: { variant: 'secondary', className: 'bg-blue-600 text-white' },
      paid: { variant: 'default', className: 'bg-emerald-600 text-white' },
      completed: { variant: 'default', className: 'bg-gray-600 text-white' },
      cancelled: { variant: 'destructive', className: 'bg-red-600 text-white' },
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

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const statusFilters: (OrderStatus | 'all' | 'paid')[] = [
    'all',
    'pending',
    'preparing',
    'ready',
    'served',
    'paid',
    'completed',
    'cancelled',
  ];

  const dateFilters: Array<{ value: typeof dateFilter; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-pos">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          <Card className="card-pos">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue, i18n.language)}
              </div>
            </CardContent>
          </Card>
          <Card className="card-pos">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Order Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.averageOrderValue, i18n.language)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <h1 className="text-2xl font-bold">{t('orders.title')}</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search order number..."
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-2">
        {dateFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={dateFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateFilter(filter.value)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Workflow Status Filters */}
      <div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => {
            // Calculate badge count from stats
            let badgeCount = 0;
            if (status === 'all') {
              badgeCount = stats?.totalOrders || 0;
            } else if (status === 'paid') {
              badgeCount = stats?.paymentStatusCounts?.paid || 0;
            } else {
              badgeCount = stats?.statusCounts?.[status] || 0;
            }

            // Define colors for each status
            const getStatusColor = () => {
              if (statusFilter === status) {
                // Active state colors
                switch (status) {
                  case 'pending':
                    return 'bg-yellow-600 hover:bg-yellow-700 text-white';
                  case 'preparing':
                    return 'bg-orange-600 hover:bg-orange-700 text-white';
                  case 'ready':
                    return 'bg-green-600 hover:bg-green-700 text-white';
                  case 'served':
                    return 'bg-blue-600 hover:bg-blue-700 text-white';
                  case 'paid':
                    return 'bg-emerald-600 hover:bg-emerald-700 text-white';
                  case 'completed':
                    return 'bg-gray-600 hover:bg-gray-700 text-white';
                  case 'cancelled':
                    return 'bg-red-600 hover:bg-red-700 text-white';
                  default:
                    return '';
                }
              } else {
                // Inactive state - outlined with status color
                switch (status) {
                  case 'pending':
                    return 'border-yellow-600 text-yellow-600 hover:bg-yellow-50';
                  case 'preparing':
                    return 'border-orange-600 text-orange-600 hover:bg-orange-50';
                  case 'ready':
                    return 'border-green-600 text-green-600 hover:bg-green-50';
                  case 'served':
                    return 'border-blue-600 text-blue-600 hover:bg-blue-50';
                  case 'paid':
                    return 'border-emerald-600 text-emerald-600 hover:bg-emerald-50';
                  case 'completed':
                    return 'border-gray-600 text-gray-600 hover:bg-gray-50';
                  case 'cancelled':
                    return 'border-red-600 text-red-600 hover:bg-red-50';
                  default:
                    return '';
                }
              }
            };

            return (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={getStatusColor()}
              >
                {status === 'all' ? t('orders.allOrders') : t(`orders.${status}`)}
                <Badge variant="secondary" className="ml-2">
                  {badgeCount}
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <Card className="card-pos">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('kds.orderNumber')}</TableHead>
                  <TableHead>{t('pos.type')}</TableHead>
                  <TableHead>{t('tables.title')}</TableHead>
                  <TableHead>{t('common.total')}</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Workflow Status</TableHead>
                  <TableHead>{t('common.time')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const statusBadge = getStatusBadge(order.status as OrderStatus);

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getOrderTypeIcon(order.order_type as OrderType)}
                          <span className="capitalize">{order.order_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.table_number || '-'}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(Number(order.total), i18n.language)}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-sm">{order.payment_method}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                          className={order.payment_status === 'paid' ? 'bg-green-600' : 'bg-gray-400'}
                        >
                          {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(statusBadge.className)}>
                          {t(`orders.${order.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(order.created_at)}
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
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('orders.orderDetails')}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('kds.orderNumber')}</p>
                  <p className="font-medium">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('tables.status')}</p>
                  <Badge className={cn(getStatusBadge(selectedOrder.status as OrderStatus).className)}>
                    {t(`orders.${selectedOrder.status}`)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('pos.type')}</p>
                  <p className="font-medium capitalize">{selectedOrder.order_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{selectedOrder.payment_method}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium">{item.dish_name}</p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                        <span className="font-medium w-20 text-right">
                          {formatCurrency(Number(item.total_price), i18n.language)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(Number(selectedOrder.subtotal), i18n.language)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT (15%):</span>
                  <span>{formatCurrency(Number(selectedOrder.vat), i18n.language)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(Number(selectedOrder.total), i18n.language)}</span>
                </div>
              </div>


              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t">
                {/* Complete Order Button - Only for paid orders */}
                {selectedOrder.payment_status === 'paid' && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <Button
                    variant="default"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      updateWorkflowStatus.mutate({
                        orderId: selectedOrder.id,
                        status: 'completed',
                      });
                      setSelectedOrder(null);
                    }}
                    disabled={updateWorkflowStatus.isPending}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Complete Order (Free Table)
                  </Button>
                )}

                {/* Status Update Buttons */}
                {selectedOrder.payment_status !== 'paid' && selectedOrder.status !== 'cancelled' && (
                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      updateOrderStatus.mutate({
                        orderId: selectedOrder.id,
                        status: 'paid',
                      });
                      setSelectedOrder(null);
                    }}
                    disabled={updateOrderStatus.isPending}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}

                {/* Undo Payment Button */}
                {selectedOrder.payment_status === 'paid' && selectedOrder.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      updateOrderStatus.mutate({
                        orderId: selectedOrder.id,
                        status: 'unpaid',
                      });
                      setSelectedOrder(null);
                    }}
                    disabled={updateOrderStatus.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Mark as Unpaid (Undo)
                  </Button>
                )}

                {/* Other Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.print()}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Receipt
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={selectedOrder.status === 'cancelled'}
                    onClick={() => {
                      updateWorkflowStatus.mutate({
                        orderId: selectedOrder.id,
                        status: 'cancelled',
                      });
                      setSelectedOrder(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('orders.cancelOrder')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Orders;
