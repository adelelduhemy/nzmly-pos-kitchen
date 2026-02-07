import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Banknote, Smartphone, Printer, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useOrderStore } from '@/store/orderStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { useToast } from '@/hooks/use-toast';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { useTables } from '@/hooks/useTables';

interface PaymentScreenProps {
  onBack: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'online';

const PaymentScreen: React.FC<PaymentScreenProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const { items, getSubtotal, getVAT, getTotal, clearOrder, currentOrderType, selectedTableId } = useOrderStore();
  const createOrder = useCreateOrder();
  const { updateTableStatus } = useTables();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const total = getTotal();
  const change = parseFloat(amountTendered || '0') - total;
  const quickAmounts = [50, 100, 200, 500];

  const paymentMethods: { method: PaymentMethod; icon: React.ElementType; labelKey: string }[] = [
    { method: 'cash', icon: Banknote, labelKey: 'payment.cash' },
    { method: 'card', icon: CreditCard, labelKey: 'payment.card' },
    { method: 'online', icon: Smartphone, labelKey: 'payment.online' },
  ];

  const handleCompletePayment = async () => {
    if (paymentMethod === 'cash' && change < 0) {
      toast({
        title: 'Insufficient Amount',
        description: 'Please enter an amount equal to or greater than the total.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Map order items to include menu_item_id for automatic inventory deduction
      const orderItems = items.map((item) => ({
        menuItemId: item.menuItem.id, // This is the menu_item.id from mockMenuItems
        dishName: isRTL ? item.menuItem.nameAr : item.menuItem.nameEn,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes,
      }));

      const result = await createOrder.mutateAsync({
        orderType: currentOrderType,
        tableNumber: selectedTableId,
        subtotal: getSubtotal(),
        vat: getVAT(),
        discount: 0,
        total: getTotal(),
        paymentMethod,
        items: orderItems,
      });

      // Update table status to occupied and link to order
      if (selectedTableId && result.order) {
        await updateTableStatus({
          id: selectedTableId,
          status: 'occupied',
          orderId: result.order.id,
        });
      }

      // Store order data for receipt
      setCompletedOrder({
        orderNumber: 'Generated', // Will be from response
        items: orderItems,
        subtotal: getSubtotal(),
        vat: getVAT(),
        total: getTotal(),
        paymentMethod,
        amountTendered: paymentMethod === 'cash' ? parseFloat(amountTendered) : getTotal(),
        change: paymentMethod === 'cash' ? change : 0,
        date: new Date(),
      });

      setIsComplete(true);
    } catch (error) {
      console.error('Payment error:', error);
      // Error toast is handled by the mutation
    }
  };

  const handleNewOrder = () => {
    setIsComplete(false);
    setCompletedOrder(null);
    clearOrder();
    onBack(); // Use onBack instead of navigate to properly return to OrderBuilder
  };

  if (isComplete) {
    return (
      <>
        {/* Success Screen - visible on screen */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center min-h-[60vh] no-print"
        >
          <Card className="card-pos max-w-md w-full text-center">
            <CardContent className="p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 bg-success/20 rounded-full mx-auto mb-6 flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-success" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">{t('payment.title')} Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Order sent to kitchen successfully.
              </p>
              <div className="space-y-3">
                <Button className="w-full" onClick={handleNewOrder}>
                  Start New Order
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4" />
                  {t('payment.printReceipt')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Receipt - visible only when printing */}
        {completedOrder && (
          <div className="hidden print:block print-receipt">
            <div className="max-w-sm mx-auto p-8 text-sm">
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
                <p className="text-muted-foreground">نظام نقاط البيع</p>
                <p className="text-xs mt-2">{new Date().toLocaleString()}</p>
              </div>

              {/* Order Number */}
              <div className="border-t border-b py-2 mb-4">
                <p className="text-center font-semibold">
                  Order #{completedOrder.orderNumber}
                </p>
                <p className="text-center text-xs">
                  {currentOrderType.toUpperCase()}
                  {selectedTableId && ` - Table ${selectedTableId}`}
                </p>
              </div>

              {/* Items */}
              <div className="mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Item</th>
                      <th className="text-center py-1">Qty</th>
                      <th className="text-right py-1">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedOrder.items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2">{item.dishName}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">
                          {formatCurrency(item.totalPrice, i18n.language)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(completedOrder.subtotal, i18n.language)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%):</span>
                  <span>{formatCurrency(completedOrder.vat, i18n.language)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(completedOrder.total, i18n.language)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="capitalize">{completedOrder.paymentMethod}</span>
                </div>
                {completedOrder.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span>Amount Tendered:</span>
                      <span>{formatCurrency(completedOrder.amountTendered, i18n.language)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span>{formatCurrency(completedOrder.change, i18n.language)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground border-t pt-4">
                <p>Thank you for your order!</p>
                <p className="mt-1">شكراً لطلبكم</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className={cn('w-5 h-5', isRTL && 'rotate-180')} />
        </Button>
        <h1 className="text-2xl font-bold">{t('payment.title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Summary */}
        <Card className="card-pos">
          <CardHeader>
            <CardTitle>{t('payment.orderSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <span className="font-medium">
                      {item.quantity}x {isRTL ? item.menuItem.nameAr : item.menuItem.nameEn}
                    </span>
                    {item.selectedVariant && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({isRTL ? item.selectedVariant.nameAr : item.selectedVariant.nameEn})
                      </span>
                    )}
                  </div>
                  <span>{formatCurrency(item.totalPrice, i18n.language)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('common.subtotal')}</span>
                <span>{formatCurrency(getSubtotal(), i18n.language)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('common.vat')} (15%)</span>
                <span>{formatCurrency(getVAT(), i18n.language)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                <span>{t('common.total')}</span>
                <span className="text-primary">{formatCurrency(total, i18n.language)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="card-pos">
          <CardHeader>
            <CardTitle>{t('payment.paymentMethod')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Method Selection */}
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map(({ method, icon: Icon, labelKey }) => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? 'default' : 'outline'}
                  className="h-20 flex-col gap-2"
                  onClick={() => setPaymentMethod(method)}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm">{t(labelKey)}</span>
                </Button>
              ))}
            </div>

            {/* Cash Payment */}
            {paymentMethod === 'cash' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t('payment.amountTendered')}
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="h-14 text-xl text-center font-bold"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t('payment.quickAmounts')}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() => setAmountTendered(amount.toString())}
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>
                </div>

                {amountTendered && (
                  <div
                    className={cn(
                      'p-4 rounded-lg text-center',
                      change >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    )}
                  >
                    <span className="text-sm">{t('payment.change')}</span>
                    <p className="text-2xl font-bold">
                      {formatCurrency(Math.max(0, change), i18n.language)}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Complete Button */}
            <Button
              className="w-full h-14 text-lg"
              onClick={handleCompletePayment}
              disabled={createOrder.isPending || (paymentMethod === 'cash' && change < 0)}
            >
              {createOrder.isPending ? (
                <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  {t('payment.completePayment')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default PaymentScreen;
