import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ClipboardList, Grid3X3, Receipt } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface StatsCardsProps {
  todaySales: number;
  activeOrders: number;
  occupiedTables: number;
  totalTables: number;
  averageOrderValue: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  todaySales,
  activeOrders,
  occupiedTables,
  totalTables,
  averageOrderValue,
}) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const stats = [
    {
      icon: TrendingUp,
      value: formatCurrency(todaySales, i18n.language),
      label: isAr ? 'مبيعات اليوم' : "Today's Sales",
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      icon: ClipboardList,
      value: activeOrders.toString(),
      label: isAr ? 'طلبات نشطة' : 'Active Orders',
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      icon: Grid3X3,
      value: `${occupiedTables}/${totalTables}`,
      label: isAr ? 'طاولات مشغولة' : 'Tables Occupied',
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      icon: Receipt,
      value: formatCurrency(averageOrderValue, i18n.language),
      label: isAr ? 'متوسط الفاتورة' : 'Avg Order Value',
      bgColor: 'bg-secondary/50',
      iconColor: 'text-secondary-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
