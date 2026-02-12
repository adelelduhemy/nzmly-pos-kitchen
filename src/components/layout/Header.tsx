import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Globe, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ isCollapsed }) => {
  const { t, i18n } = useTranslation();
  const { profile } = useAuthContext();
  const isRTL = i18n.language === 'ar';

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-6 z-40 transition-all duration-300',
        isRTL
          ? isCollapsed ? 'left-0 right-20' : 'left-0 right-[280px]'
          : isCollapsed ? 'left-20' : 'left-[280px]'
      )}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-foreground">
          {t('common.welcome')}, {profile?.name?.split(' ')[0]}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* Language Toggle */}
        <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">
            {i18n.language === 'en' ? 'العربية' : 'English'}
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {profile?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden sm:inline font-medium">
                {profile?.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48 bg-popover">
            <DropdownMenuItem>
              {t('settings.preferences')}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
