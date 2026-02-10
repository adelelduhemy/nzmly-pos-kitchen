import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Radio, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import OrderCard from '@/components/kds/OrderCard';

const KDS: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { data: orders = [], isLoading, refetch } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const previousPendingCount = useRef(0);

  // Play sound when new pending orders arrive
  useEffect(() => {
    const pendingCount = orders.filter((o) => o.status === 'pending').length;

    if (pendingCount > previousPendingCount.current && previousPendingCount.current > 0) {
      // New order arrived - play notification beep using Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800; // Hz
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        // Second beep
        setTimeout(() => {
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContext.destination);
          osc2.frequency.value = 1000;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          osc2.start(audioContext.currentTime);
          osc2.stop(audioContext.currentTime + 0.5);
        }, 200);
      } catch (err) {
        console.log('[KDS] Audio notification not supported');
      }
    }

    previousPendingCount.current = pendingCount;
  }, [orders]);

  const handleStatusUpdate = (orderId: string, newStatus: string, version: number) => {
    updateStatus.mutate({ orderId, status: newStatus, expectedVersion: version });
  };

  // Group orders by status
  const pendingOrders = orders.filter((order) => order.status === 'pending');
  const preparingOrders = orders.filter((order) => order.status === 'preparing');
  const readyOrders = orders.filter((order) => order.status === 'ready');

  const statusColumns = [
    {
      status: 'pending',
      title: t('kds.pending'),
      orders: pendingOrders,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      status: 'preparing',
      title: t('kds.preparing'),
      orders: preparingOrders,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      status: 'ready',
      title: t('kds.ready'),
      orders: readyOrders,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {t('kds.title')}
              </h1>
              <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                <Radio className="w-3 h-3" />
                {t('kds.live')}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                {t('kds.totalOrders')}: <span className="font-bold">{orders.length}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Kanban Columns */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statusColumns.map((column) => (
            <div key={column.status} className="flex flex-col">
              {/* Column Header */}
              <div className={cn('p-4 rounded-t-lg border-2', column.bgColor, column.borderColor)}>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">{column.title}</h2>
                  <Badge variant="secondary">{column.orders.length}</Badge>
                </div>
              </div>

              {/* Column Content */}
              <ScrollArea className={cn('flex-1 p-4 rounded-b-lg border-2 border-t-0 min-h-[600px]', column.bgColor, column.borderColor)}>
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {column.orders.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-muted-foreground">
                        {t('kds.noOrders')}
                      </div>
                    ) : (
                      column.orders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onStatusUpdate={handleStatusUpdate}
                          isUpdating={updateStatus.isPending}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </div>

      {/* No Orders Display */}
      {orders.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {t('kds.noActiveOrders')}
          </h3>
          <p className="text-muted-foreground">
            {t('kds.waitingForOrders')}
          </p>
        </div>
      )}
    </div>
  );
};

export default KDS;
