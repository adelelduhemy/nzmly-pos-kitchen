import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Truck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mockTables } from '@/data/mockData';
import { useOrderStore } from '@/store/orderStore';
import { OrderType, TableStatus } from '@/types';
import OrderBuilder from '@/components/pos/OrderBuilder';

type POSStep = 'table-selection' | 'order-builder';

const POS = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [step, setStep] = useState<POSStep>('table-selection');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'indoor' | 'outdoor'>('all');

  const { currentOrderType, setOrderType, selectedTableId, setSelectedTable } = useOrderStore();

  const orderTypes: { type: OrderType; icon: React.ElementType; labelKey: string }[] = [
    { type: 'takeaway', icon: Users, labelKey: 'pos.takeaway' },
    { type: 'delivery', icon: Truck, labelKey: 'pos.delivery' },
  ];

  const filteredTables = mockTables.filter((table) =>
    sectionFilter === 'all' ? true : table.section === sectionFilter
  );

  const getStatusColor = (status: TableStatus): string => {
    const colors: Record<TableStatus, string> = {
      available: 'table-status-available',
      occupied: 'table-status-occupied',
      reserved: 'table-status-reserved',
      cleaning: 'table-status-cleaning',
    };
    return colors[status];
  };

  const getStatusLabel = (status: TableStatus): string => {
    const labels: Record<TableStatus, string> = {
      available: t('pos.available'),
      occupied: t('pos.occupied'),
      reserved: t('pos.reserved'),
      cleaning: t('pos.cleaning'),
    };
    return labels[status];
  };

  const handleTableSelect = (tableId: string) => {
    setSelectedTable(tableId);
    setStep('order-builder');
  };

  const handleQuickOrderType = (type: OrderType) => {
    setOrderType(type);
    if (type === 'delivery') {
      setSelectedTable(null); // Clear any selected table
      setStep('order-builder');
    } else {
      setStep('table-selection');
    }
  };

  if (step === 'order-builder') {
    return <OrderBuilder onBack={() => setStep('table-selection')} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Order Type Selection */}
      <div className="flex flex-wrap gap-3">
        {orderTypes.map(({ type, icon: Icon, labelKey }) => (
          <Button
            key={type}
            variant={currentOrderType === type ? 'default' : 'outline'}
            size="lg"
            onClick={() => handleQuickOrderType(type)}
            className="gap-2 min-h-[44px]"
          >
            <Icon className="w-5 h-5" />
            {t(labelKey)}
          </Button>
        ))}
      </div>

      {/* Section Filter */}
      <div className="flex gap-2">
        {(['all', 'indoor', 'outdoor'] as const).map((section) => (
          <Button
            key={section}
            variant={sectionFilter === section ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSectionFilter(section)}
          >
            {section === 'all'
              ? t('pos.allSections')
              : section === 'indoor'
                ? t('pos.indoor')
                : t('pos.outdoor')}
          </Button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <AnimatePresence>
          {filteredTables.map((table, index) => (
            <motion.button
              key={table.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => table.status === 'available' && handleTableSelect(table.id)}
              disabled={table.status !== 'available'}
              className={cn(
                'aspect-square rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all duration-200',
                getStatusColor(table.status),
                table.status === 'available' && 'hover:scale-105 cursor-pointer',
                table.status !== 'available' && 'opacity-70 cursor-not-allowed'
              )}
            >
              <span className="text-2xl font-bold">{table.number}</span>
              <span className="text-sm">
                <Users className="w-4 h-4 inline mr-1" />
                {table.capacity}
              </span>
              <span className="text-xs font-medium">{getStatusLabel(table.status)}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
        {(['available', 'occupied', 'reserved', 'cleaning'] as TableStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className={cn(
                'w-4 h-4 rounded border-2',
                getStatusColor(status)
              )}
            />
            <span className="text-sm text-muted-foreground">{getStatusLabel(status)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default POS;
