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
  Utensils,
  Heart,
  Truck,
  QrCode,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { AppRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { mockDailySales, mockTopSellingItems, getLowStockItems } from '@/data/mockData';
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
  roles: AppRole[];
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
    roles: ['owner', 'manager', 'cashier'],
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: ClipboardList,
    titleAr: 'الطلبات',
    titleEn: 'Orders',
    descAr: 'إدارة الطلبات النشطة',
    descEn: 'Manage active orders',
    path: '/orders',
    roles: ['owner', 'manager', 'cashier'],
    color: 'from-green-500 to-green-600',
  },
  {
    icon: ChefHat,
    titleAr: 'شاشة المطبخ',
    titleEn: 'Kitchen Display',
    descAr: 'عرض طلبات المطبخ',
    descEn: 'View kitchen orders',
    path: '/kds',
    roles: ['owner', 'manager', 'kitchen'],
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: UtensilsCrossed,
    titleAr: 'إدارة القائمة',
    titleEn: 'Menu Management',
    descAr: 'تعديل الأصناف والأسعار',
    descEn: 'Edit items and prices',
    path: '/menu',
    roles: ['owner', 'manager'],
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Grid3X3,
    titleAr: 'الطاولات',
    titleEn: 'Tables',
    descAr: 'إدارة طاولات المطعم',
    descEn: 'Manage restaurant tables',
    path: '/tables',
    roles: ['owner', 'manager', 'cashier'],
    color: 'from-teal-500 to-teal-600',
  },
  {
    icon: Package,
    titleAr: 'المخزون',
    titleEn: 'Inventory',
    descAr: 'إدارة المستودعات والمواد',
    descEn: 'Manage warehouses & materials',
    path: '/inventory',
    roles: ['owner', 'manager', 'inventory'],
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: Utensils,
    titleAr: 'الأطباق والوصفات',
    titleEn: 'Dishes & Recipes',
    descAr: 'ربط الأطباق بالمواد الخام',
    descEn: 'Link dishes to ingredients',
    path: '/dishes',
    roles: ['owner', 'manager'],
    color: 'from-rose-500 to-rose-600',
  },
  {
    icon: DollarSign,
    titleAr: 'الإدارة المالية',
    titleEn: 'Financial Management',
    descAr: 'المصروفات والشيفتات',
    descEn: 'Expenses & Shifts',
    path: '/finance',
    roles: ['owner', 'manager'],
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: BarChart3,
    titleAr: 'التقارير',
    titleEn: 'Reports',
    descAr: 'تحليل المبيعات',
    descEn: 'Sales analytics',
    path: '/reports',
    roles: ['owner', 'manager'],
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: Truck,
    titleAr: 'الموردين',
    titleEn: 'Suppliers',
    descAr: 'إدارة الموردين والمشتريات',
    descEn: 'Suppliers & purchases',
    path: '/suppliers',
    roles: ['owner', 'manager', 'inventory'],
    color: 'from-slate-500 to-slate-600',
  },
  {
    icon: QrCode,
    titleAr: 'المنيو الأونلاين',
    titleEn: 'Online Menu',
    descAr: 'QR Code والمنيو الرقمي',
    descEn: 'QR Code & digital menu',
    path: '/online-menu',
    roles: ['owner', 'manager'],
    color: 'from-violet-500 to-violet-600',
  },
  {
    icon: Heart,
    titleAr: 'إدارة العملاء',
    titleEn: 'CRM',
    descAr: 'نقاط الولاء والكوبونات',
    descEn: 'Loyalty & coupons',
    path: '/crm',
    roles: ['owner', 'manager'],
    color: 'from-pink-500 to-pink-600',
  },
  {
    icon: Users,
    titleAr: 'المستخدمين',
    titleEn: 'Users',
    descAr: 'إدارة الموظفين والصلاحيات',
    descEn: 'Manage staff & permissions',
    path: '/users',
    roles: ['owner', 'manager'],
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    icon: Settings,
    titleAr: 'الإعدادات',
    titleEn: 'Settings',
    descAr: 'إعدادات النظام',
    descEn: 'System settings',
    path: '/settings',
    roles: ['owner'],
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
  const { profile, roles, hasRole } = useAuthContext();
  const isAr = i18n.language === 'ar';

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({
    todaySales: 12450,
    activeOrders: 8,
    occupiedTables: 5,
    totalTables: 12,
    averageOrderValue: 85.5,
  });

  useEffect(() => {
    // Generate alerts based on data
    const lowStockItems = getLowStockItems();
    const newAlerts: Alert[] = [];

    lowStockItems.forEach((item, index) => {
      newAlerts.push({
        id: `low-stock-${index}`,
        type: 'low_stock',
        title: isAr ? `نقص في المخزون: ${item.name}` : `Low Stock: ${item.name}`,
        description: isAr 
          ? `المتبقي: ${item.currentStock} ${item.unit} (الحد الأدنى: ${item.minimumStock})`
          : `Remaining: ${item.currentStock} ${item.unit} (Min: ${item.minimumStock})`,
        severity: item.currentStock < item.minimumStock / 2 ? 'error' : 'warning',
      });
    });

    setAlerts(newAlerts);
  }, [isAr]);

  // Filter cards based on user roles
  const filteredCards = navCards.filter((card) => {
    if (roles.length === 0) {
      return true;
    }
    return card.roles.some((role) => hasRole(role));
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
      <StatsCards
        todaySales={stats.todaySales}
        activeOrders={stats.activeOrders}
        occupiedTables={stats.occupiedTables}
        totalTables={stats.totalTables}
        averageOrderValue={stats.averageOrderValue}
      />

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
        <TopSellingItems items={mockTopSellingItems} />
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Sales Chart at Bottom */}
      <SalesChart data={mockDailySales} />
    </div>
  );
};

export default Dashboard;
