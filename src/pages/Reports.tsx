import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, Download, TrendingUp, CreditCard, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/utils/formatCurrency';
import { useSalesAnalytics } from '@/hooks/useSalesAnalytics';
import { startOfDay, endOfDay } from 'date-fns';

const Reports = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [startDate, setStartDate] = useState<Date>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfDay(new Date()));

  const { data: analytics, isLoading } = useSalesAnalytics(startDate, endDate);

  // Map payment methods to colors
  const paymentColorMap: Record<string, string> = {
    'Cash': 'hsl(142, 71%, 45%)',
    'Card': 'hsl(217, 91%, 60%)',
    'Online': 'hsl(38, 92%, 50%)',
  };

  const paymentMethodsData = analytics?.paymentMethods.map(pm => ({
    name: pm.name,
    value: pm.value,
    color: paymentColorMap[pm.name] || 'hsl(var(--primary))',
  })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
        <div className="flex gap-2 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">Start Date</label>
            <Input
              type="date"
              className="w-40"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setStartDate(startOfDay(new Date(e.target.value)));
                }
              }}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">End Date</label>
            <Input
              type="date"
              className="w-40"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setEndDate(endOfDay(new Date(e.target.value)));
                }
              }}
            />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              window.print();
            }}
          >
            <Download className="w-4 h-4" />
            {t('reports.exportPdf')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="card-pos">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('reports.dailySales')}</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics?.totalSales || 0, i18n.language)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{analytics?.totalOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-pos">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics?.avgOrderValue || 0, i18n.language)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="card-pos">
          <CardHeader>
            <CardTitle>{t('reports.salesTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.hourlyTrend || []}>
                  <defs>
                    <linearGradient id="salesGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    reversed={isRTL}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    orientation={isRTL ? 'right' : 'left'}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value, i18n.language), 'Sales']}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#salesGradient2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="card-pos">
          <CardHeader>
            <CardTitle>{t('reports.paymentMethods')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentMethodsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {paymentMethodsData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">{entry.name}: {entry.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Items */}
      <Card className="card-pos">
        <CardHeader>
          <CardTitle>{t('reports.topItems')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.topItems || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  orientation={isRTL ? 'right' : 'left'}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Reports;
