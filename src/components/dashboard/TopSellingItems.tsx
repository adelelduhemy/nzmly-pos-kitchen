import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface TopSellingItemsProps {
  items: TopItem[];
}

const TopSellingItems: React.FC<TopSellingItemsProps> = ({ items }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600';
      case 1:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-500';
      case 2:
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="card-pos">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          {isAr ? 'الأكثر مبيعاً' : 'Top Selling'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.slice(0, 5).map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${getMedalColor(index)}`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} {isAr ? 'طلب' : 'orders'}
                  </p>
                </div>
              </div>
              <span className="font-bold text-success">
                {formatCurrency(item.revenue, i18n.language)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopSellingItems;
