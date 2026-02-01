import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Package, Clock, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
  id: string;
  type: 'low_stock' | 'delayed_order' | 'low_sales';
  title: string;
  description: string;
  severity: 'warning' | 'error' | 'info';
}

interface AlertsPanelProps {
  alerts: Alert[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'low_stock':
        return <Package className="w-5 h-5" />;
      case 'delayed_order':
        return <Clock className="w-5 h-5" />;
      case 'low_sales':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-destructive/10 border-destructive/50 text-destructive';
      case 'warning':
        return 'bg-warning/10 border-warning/50 text-warning';
      default:
        return 'bg-primary/10 border-primary/50 text-primary';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="card-pos">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            {isAr ? 'التنبيهات' : 'Alerts'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✓</span>
            </div>
            <p>{isAr ? 'لا توجد تنبيهات حالياً' : 'No alerts at the moment'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-pos">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          {isAr ? 'التنبيهات' : 'Alerts'}
          <span className="px-2 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
            {alerts.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence>
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: isAr ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isAr ? -20 : 20 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-start gap-3 p-3 rounded-lg border ${getSeverityStyles(alert.severity)}`}
              >
                <div className="mt-0.5">{getIcon(alert.type)}</div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs opacity-80">{alert.description}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
