import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Globe, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import nazmliLogo from '@/assets/nazmli-logo.png';

const SimpleLayout: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuthContext();
  const isRTL = i18n.language === 'ar';
  const isHome = location.pathname === '/dashboard';

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {!isHome && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="hover:bg-muted"
            >
              {isRTL ? <ArrowRight className="w-5 h-5" /> : <Home className="w-5 h-5" />}
            </Button>
          )}
          <img src={nazmliLogo} alt="نظملي" className="h-10 w-auto" />
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">
              {i18n.language === 'en' ? 'العربية' : 'English'}
            </span>
          </Button>

          {/* User Info */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <span className="hidden sm:inline font-medium text-foreground">
              {profile?.name || 'مستخدم'}
            </span>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default SimpleLayout;
