import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Building2, User, Globe, Moon, Sun, Bell, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { AppRole } from '@/hooks/useAuth';

const roleLabels: Record<AppRole, { ar: string; en: string; color: string }> = {
  owner: { ar: 'مالك', en: 'Owner', color: 'bg-purple-500' },
  manager: { ar: 'مدير', en: 'Manager', color: 'bg-blue-500' },
  cashier: { ar: 'كاشير', en: 'Cashier', color: 'bg-green-500' },
  kitchen: { ar: 'مطبخ', en: 'Kitchen', color: 'bg-orange-500' },
  inventory: { ar: 'مخزون', en: 'Inventory', color: 'bg-amber-500' },
};

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { profile, roles } = useAuthContext();
  const isRTL = i18n.language === 'ar';

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-3xl"
    >
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      {/* Restaurant Profile */}
      <Card className="card-pos">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {t('settings.restaurant')}
          </CardTitle>
          <CardDescription>
            {isRTL ? 'إدارة معلومات المطعم' : 'Manage your restaurant information'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('settings.restaurantName')} (English)</Label>
              <Input defaultValue="Nazmli Restaurant" />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.restaurantName')} (العربية)</Label>
              <Input defaultValue="مطعم نظملي" dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.vatNumber')}</Label>
              <Input defaultValue="300123456789012" />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'رمز الفرع' : 'Branch Code'}</Label>
              <Input defaultValue="JED" />
            </div>
          </div>
          <Button>{t('common.save')}</Button>
        </CardContent>
      </Card>

      {/* User Preferences */}
      <Card className="card-pos">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t('settings.preferences')}
          </CardTitle>
          <CardDescription>
            {isRTL ? 'تخصيص تجربتك' : 'Customize your experience'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Language / اللغة</p>
                <p className="text-sm text-muted-foreground">
                  {i18n.language === 'en' ? 'English' : 'العربية'}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={toggleLanguage}>
              {i18n.language === 'en' ? 'العربية' : 'English'}
            </Button>
          </div>

          <Separator />

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{isRTL ? 'الوضع الليلي' : 'Dark Mode'}</p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'التبديل بين المظهر الفاتح والداكن' : 'Switch between light and dark theme'}
                </p>
              </div>
            </div>
            <Switch />
          </div>

          <Separator />

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{isRTL ? 'الإشعارات الصوتية' : 'Sound Notifications'}</p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'تشغيل صوت للطلبات الجديدة' : 'Play sound for new orders'}
                </p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="card-pos">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {isRTL ? 'الحساب' : 'Account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">{profile?.name || 'مستخدم'}</p>
              <p className="text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isRTL ? 'الصلاحيات:' : 'Roles:'}
                </span>
                {roles.length === 0 ? (
                  <Badge variant="outline">{isRTL ? 'بدون صلاحيات' : 'No roles'}</Badge>
                ) : (
                  roles.map((role) => (
                    <Badge 
                      key={role.id} 
                      className={`${roleLabels[role.role].color} text-white`}
                    >
                      {isRTL ? roleLabels[role.role].ar : roleLabels[role.role].en}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Settings;
