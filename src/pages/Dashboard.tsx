import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  ClipboardList,
  ChefHat,
  UtensilsCrossed,
  Grid3X3,
  Package,
  BarChart3,
  Settings,
  Users,
  DollarSign,
  Heart,
  Truck,
  QrCode,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { AppRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useLowStockAlerts } from '@/hooks/useLowStockAlerts';
import { useTopSellingItems } from '@/hooks/useTopSellingItems';
import { useDailySales } from '@/hooks/useDailySales';
import SalesChart from '@/components/dashboard/SalesChart';
import TopSellingItems from '@/components/dashboard/TopSellingItems';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import StatsCards from '@/components/dashboard/StatsCards';

interface NavCard {
  icon: React.ElementType;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  path: string;
  resource: string;
  color: string;
}

const navCards: NavCard[] = [
  {
    icon: ShoppingCart,
    titleAr: 'نقطة البيع',
    titleEn: 'Point of Sale',
    descAr: 'إنشاء طلبات جديدة',
    descEn: 'Create new orders',
    path: '/pos',
    resource: 'pos',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: ClipboardList,
    titleAr: 'الطلبات',
    titleEn: 'Orders',
    descAr: 'إدارة الطلبات النشطة',
    descEn: 'Manage active orders',
    path: '/orders',
    resource: 'orders',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: ChefHat,
    titleAr: 'شاشة المطبخ',
    titleEn: 'Kitchen Display',
    descAr: 'عرض طلبات المطبخ',
    descEn: 'View kitchen orders',
    path: '/kds',
    resource: 'kds',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: UtensilsCrossed,
    titleAr: 'إدارة القائمة',
    titleEn: 'Menu Management',
    descAr: 'تعديل الأصناف والأسعار',
    descEn: 'Edit items and prices',
    path: '/menu',
    resource: 'menu',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Grid3X3,
    titleAr: 'الطاولات',
    titleEn: 'Tables',
    descAr: 'إدارة طاولات المطعم',
    descEn: 'Manage restaurant tables',
    path: '/tables',
    resource: 'tables',
    color: 'from-teal-500 to-teal-600',
  },
  {
    icon: Package,
    titleAr: 'المخزون',
    titleEn: 'Inventory',
    descAr: 'إدارة المستودعات والمواد',
    descEn: 'Manage warehouses & materials',
    path: '/inventory',
    resource: 'inventory',
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: DollarSign,
    titleAr: 'الإدارة المالية',
    titleEn: 'Financial Management',
    descAr: 'المصروفات والشيفتات',
    descEn: 'Expenses & Shifts',
    path: '/finance',
    resource: 'finance',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: BarChart3,
    titleAr: 'التقارير',
    titleEn: 'Reports',
    descAr: 'تحليل المبيعات',
    descEn: 'Sales analytics',
    path: '/reports',
    resource: 'reports',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: Truck,
    titleAr: 'الموردين',
    titleEn: 'Suppliers',
    descAr: 'إدارة الموردين والمشتريات',
    descEn: 'Suppliers & purchases',
    path: '/suppliers',
    resource: 'suppliers',
    color: 'from-slate-500 to-slate-600',
  },
  {
    icon: QrCode,
    titleAr: 'المنيو الأونلاين',
    titleEn: 'Online Menu',
    descAr: 'QR Code والمنيو الرقمي',
    descEn: 'QR Code & digital menu',
    path: '/online-menu',
    resource: 'menu',
    color: 'from-violet-500 to-violet-600',
  },
  {
    icon: Heart,
    titleAr: 'إدارة العملاء',
    titleEn: 'CRM',
    descAr: 'نقاط الولاء والكوبونات',
    descEn: 'Loyalty & coupons',
    path: '/crm',
    resource: 'crm',
    color: 'from-pink-500 to-pink-600',
  },
  {
    icon: Users,
    titleAr: 'المستخدمين',
    titleEn: 'Users',
    descAr: 'إدارة الموظفين والصلاحيات',
    descEn: 'Manage staff & permissions',
    path: '/users',
    resource: 'users',
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    icon: Settings,
    titleAr: 'الإعدادات',
    titleEn: 'Settings',
    descAr: 'إعدادات النظام',
    descEn: 'System settings',
    path: '/settings',
    resource: 'settings',
    color: 'from-gray-500 to-gray-600',
  },
];

interface Alert {
  id: string;
  type: 'low_stock' | 'delayed_order' | 'low_sales';
  title: string;
  description: string;
  severity: 'warning' | 'error' | 'info';
}

const Dashboard = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { profile, roles, hasPermission } = useAuthContext();
  const isAr = i18n.language === 'ar';

  const { data: stats, isLoading } = useDashboardStats();
  const { data: lowStockAlerts = [] } = useLowStockAlerts();
  const { data: topSellingItems = [] } = useTopSellingItems();
  const { data: dailySales = [] } = useDailySales();

  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Generate alerts from real low stock data
    const newAlerts: Alert[] = lowStockAlerts.map((item) => ({
      id: `low-stock-${item.id}`,
      type: 'low_stock' as const,
      title: isAr ? `نقص في المخزون: ${item.nameAr}` : `Low Stock: ${item.nameEn}`,
      description: isAr
        ? `المتبقي: ${item.currentStock} ${item.unit} (الحد الأدنى: ${item.minimumStock})`
        : `Remaining: ${item.currentStock} ${item.unit} (Min: ${item.minimumStock})`,
      severity: item.severity,
    }));

    // Only update if alerts actually changed to prevent infinite loop
    const alertsChanged = newAlerts.length !== alerts.length ||
      JSON.stringify(newAlerts) !== JSON.stringify(alerts);
    
    if (alertsChanged) {
      setAlerts(newAlerts);
    }
  }, [lowStockAlerts.length, isAr]);

  // Filter cards based on user permissions from role_permissions matrix
  const filteredCards = navCards.filter((card) => {
    if (roles.length === 0) {
      return true;
    }
    return hasPermission(card.resource);
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const firstName = profile?.name?.split(' ')[0] || (isAr ? 'مستخدم' : 'User');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isAr ? `أهلاً ${firstName}` : `Welcome ${firstName}`}
        </h1>
        <p className="text-muted-foreground">
          {isAr ? 'اختر القسم اللي عايز تدخله' : 'Choose the section you want to access'}
        </p>
        {roles.length === 0 && (
          <p className="text-sm text-warning mt-2">
            {isAr 
              ? 'ملاحظة: حسابك جديد ولم يتم تعيين صلاحيات له بعد. تواصل مع المدير.'
              : 'Note: Your account is new and has no roles assigned yet. Contact a manager.'
            }
          </p>
        )}
      </div>

      {/* Quick Stats */}
      {stats && (
        <StatsCards
          todaySales={stats.todaySales}
          activeOrders={stats.activeOrders}
          occupiedTables={stats.occupiedTables}
          totalTables={stats.totalTables}
          averageOrderValue={stats.averageOrderValue}
        />
      )}

      {/* All Navigation Cards */}
      <div>
        <h2 className="text-xl font-bold mb-4">{isAr ? 'جميع الأقسام' : 'All Sections'}</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {filteredCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.path}
                variants={cardVariants}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(card.path)}
                className={`
                  relative overflow-hidden rounded-2xl p-5 text-white
                  bg-gradient-to-br ${card.color}
                  shadow-lg hover:shadow-xl transition-shadow
                  flex flex-col items-center justify-center gap-3
                  min-h-[140px]
                  focus:outline-none focus:ring-4 focus:ring-primary/30
                `}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-8 -right-8 w-28 h-28 bg-white rounded-full" />
                  <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white rounded-full" />
                </div>
                <div className="relative z-10 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="relative z-10 text-center">
                  <h3 className="text-base font-bold">
                    {isAr ? card.titleAr : card.titleEn}
                  </h3>
                  <p className="text-xs opacity-90 mt-0.5">
                    {isAr ? card.descAr : card.descEn}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Top Selling Items and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSellingItems items={topSellingItems} />
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Sales Chart at Bottom */}
      <SalesChart data={dailySales} />
    </div>
  );
};

export default Dashboard;
