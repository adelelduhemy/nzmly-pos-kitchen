import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, Users, Truck, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Order } from '@/hooks/useOrders';
import { formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
    order: Order;
    onStatusUpdate: (orderId: string, newStatus: string) => void;
    isUpdating?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusUpdate, isUpdating }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const getNextStatus = () => {
        switch (order.status) {
            case 'pending':
                return 'preparing';
            case 'preparing':
                return 'ready';
            case 'ready':
                return 'served';
            default:
                return order.status;
        }
    };

    const getStatusColor = () => {
        switch (order.status) {
            case 'pending':
                return 'bg-yellow-500/10 border-yellow-500 text-yellow-700';
            case 'preparing':
                return 'bg-blue-500/10 border-blue-500 text-blue-700';
            case 'ready':
                return 'bg-green-500/10 border-green-500 text-green-700';
            default:
                return 'bg-gray-500/10 border-gray-500 text-gray-700';
        }
    };

    const getButtonText = () => {
        switch (order.status) {
            case 'pending':
                return t('kds.startCooking');
            case 'preparing':
                return t('kds.markReady');
            case 'ready':
                return t('kds.markServed');
            default:
                return '';
        }
    };

    const getOrderTypeIcon = () => {
        switch (order.order_type) {
            case 'takeaway':
                return <ShoppingBag className="w-4 h-4" />;
            case 'delivery':
                return <Truck className="w-4 h-4" />;
            default:
                return <Users className="w-4 h-4" />;
        }
    };

    const timeElapsed = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
        >
            <Card className={cn('border-2', getStatusColor())}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <CardTitle className="text-lg font-bold">{order.order_number}</CardTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                {getOrderTypeIcon()}
                                <span>
                                    {order.table_number
                                        ? `${t('kds.table')} ${order.table_number}`
                                        : t(`pos.${order.order_type}`)}
                                </span>
                            </div>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeElapsed}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    {/* Order Items */}
                    <div className="space-y-1">
                        {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="font-medium">
                                    {item.quantity}x {item.dish_name}
                                </span>
                                {item.notes && (
                                    <span className="text-xs text-muted-foreground italic">{item.notes}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                        <div className="p-2 bg-muted rounded-md">
                            <p className="text-xs text-muted-foreground">
                                <span className="font-semibold">{t('kds.notes')}:</span> {order.notes}
                            </p>
                        </div>
                    )}

                    {/* Action Button */}
                    {order.status !== 'served' && (
                        <Button
                            className="w-full"
                            onClick={() => onStatusUpdate(order.id, getNextStatus())}
                            disabled={isUpdating}
                        >
                            {isUpdating ? t('common.loading') : getButtonText()}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default OrderCard;
