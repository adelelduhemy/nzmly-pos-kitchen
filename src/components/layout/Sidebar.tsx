import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  ChefHat,
  UtensilsCrossed,
  Grid3X3,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import nazmliLogo from '@/assets/nazmli-logo.png';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  path: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard', roles: ['owner', 'manager', 'cashier'] },
  { icon: ShoppingCart, labelKey: 'nav.pos', path: '/pos', roles: ['owner', 'manager', 'cashier'] },
  { icon: ClipboardList, labelKey: 'nav.orders', path: '/orders', roles: ['owner', 'manager', 'cashier'] },
  { icon: ChefHat, labelKey: 'nav.kds', path: '/kds', roles: ['owner', 'manager', 'kitchen'] },
  { icon: UtensilsCrossed, labelKey: 'nav.menu', path: '/menu', roles: ['owner', 'manager'] },
  { icon: Grid3X3, labelKey: 'nav.tables', path: '/tables', roles: ['owner', 'manager', 'cashier'] },
  { icon: Package, labelKey: 'nav.inventory', path: '/inventory', roles: ['owner', 'manager', 'inventory'] },
  { icon: BarChart3, labelKey: 'nav.reports', path: '/reports', roles: ['owner', 'manager'] },
  { icon: Settings, labelKey: 'nav.settings', path: '/settings', roles: ['owner'] },
];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, hasPermission, signOut } = useAuthContext();
  const isRTL = i18n.language === 'ar';

  // Alias signOut to logout for compatibility
  const logout = signOut;

  const filteredNavItems = navItems.filter(
    (item) => {
      // Map path to resource name (simple mapping for now)
      const resource = item.path.replace('/', '');
      return hasPermission(resource);
    }
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className={cn(
        'fixed top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50',
        isRTL ? 'right-0 border-l border-r-0' : 'left-0'
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <img src={nazmliLogo} alt="Nazmli" className="h-12 w-auto" />
              <span className="font-bold text-xl text-sidebar-foreground">
                {i18n.language === 'ar' ? 'نظملي' : 'Nazmli'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onToggle}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors',
            isCollapsed && 'mx-auto'
          )}
        >
          {isCollapsed ? (
            <Menu className="w-5 h-5 text-sidebar-foreground" />
          ) : isRTL ? (
            <ChevronRight className="w-5 h-5 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 h-12 px-3 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent',
                    isCollapsed && 'justify-center px-0'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        {t(item.labelKey)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <AnimatePresence mode="wait">
          {!isCollapsed && user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-3 px-3 py-2"
            >
              <p className="font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 h-12 px-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors',
            isCollapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium"
              >
                {t('common.logout')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
