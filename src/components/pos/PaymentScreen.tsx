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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const total = getTotal();
  const change = parseFloat(amountTendered || '0') - total;
  const quickAmounts = [50, 100, 200, 500];

  const paymentMethods: { method: PaymentMethod; icon: React.ElementType; labelKey: string }[] = [
    { method: 'cash', icon: Banknote, labelKey: 'payment.cash' },
    { method: 'card', icon: CreditCard, labelKey: 'payment.card' },
    { method: 'online', icon: Smartphone, labelKey: 'payment.online' },
  ];

  const handleCompletePayment = () => {
    if (paymentMethod === 'cash' && change < 0) {
      toast({
        title: 'Insufficient Amount',
        description: 'Please enter an amount equal to or greater than the total.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
      toast({
        title: 'Payment Complete!',
        description: 'Order has been sent to the kitchen.',
      });
    }, 1500);
  };

  const handleNewOrder = () => {
    clearOrder();
    navigate('/pos');
  };

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[60vh]"
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
              <Button variant="outline" className="w-full gap-2">
                <Printer className="w-4 h-4" />
                {t('payment.printReceipt')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
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
              disabled={isProcessing || (paymentMethod === 'cash' && change < 0)}
            >
              {isProcessing ? (
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
