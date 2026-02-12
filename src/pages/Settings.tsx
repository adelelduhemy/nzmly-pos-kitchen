import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Building2, User, Globe, Moon, Bell, Shield, Loader2, Save, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { AppRole } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

  // Restaurant profile state
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [restaurantNameEn, setRestaurantNameEn] = useState('');
  const [restaurantNameAr, setRestaurantNameAr] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Loyalty settings
  const [loyaltyPointsPerSar, setLoyaltyPointsPerSar] = useState(1);
  const [loyaltyRedemptionValue, setLoyaltyRedemptionValue] = useState(0.10);

  // Preferences state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('soundEnabled');
    return stored === null ? true : stored === 'true';
  });

  // Fetch restaurant settings from DB
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('restaurant_settings')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setSettingsId(data.id);
          setRestaurantNameEn(data.restaurant_name_en || '');
          setRestaurantNameAr(data.restaurant_name_ar || '');
          setVatNumber((data as any).vat_number || '');
          setBranchCode((data as any).branch_code || '');
          setLoyaltyPointsPerSar((data as any).loyalty_points_per_sar ?? 1);
          setLoyaltyRedemptionValue((data as any).loyalty_redemption_value ?? 0.10);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Apply dark mode on mount and change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  // Persist sound preference
  useEffect(() => {
    localStorage.setItem('soundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        restaurant_name_en: restaurantNameEn,
        restaurant_name_ar: restaurantNameAr,
        vat_number: vatNumber,
        branch_code: branchCode,
        loyalty_points_per_sar: loyaltyPointsPerSar,
        loyalty_redemption_value: loyaltyRedemptionValue,
      };

      if (settingsId) {
        // Update existing
        const { error } = await supabase
          .from('restaurant_settings')
          .update(payload as any)
          .eq('id', settingsId);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('restaurant_settings')
          .insert(payload as any)
          .select()
          .single();

        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      toast({
        title: isRTL ? 'تم الحفظ' : 'Saved',
        description: isRTL ? 'تم حفظ إعدادات المطعم بنجاح' : 'Restaurant settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل في حفظ الإعدادات' : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('settings.restaurantName')} (English)</Label>
                  <Input
                    value={restaurantNameEn}
                    onChange={(e) => setRestaurantNameEn(e.target.value)}
                    placeholder="Restaurant Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.restaurantName')} (العربية)</Label>
                  <Input
                    value={restaurantNameAr}
                    onChange={(e) => setRestaurantNameAr(e.target.value)}
                    placeholder="اسم المطعم"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.vatNumber')}</Label>
                  <Input
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="300XXXXXXXXX012"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'رمز الفرع' : 'Branch Code'}</Label>
                  <Input
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    placeholder="JED"
                  />
                </div>
              </div>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />
                ) : (
                  <Save className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                )}
                {t('common.save')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Loyalty Program */}
      <Card className="card-pos">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            {isRTL ? 'برنامج الولاء' : 'Loyalty Program'}
          </CardTitle>
          <CardDescription>
            {isRTL ? 'إعداد نظام نقاط الولاء للعملاء' : 'Configure the customer loyalty points system'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRTL ? 'نقاط لكل ريال' : 'Points per SAR Spent'}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={loyaltyPointsPerSar}
                    onChange={(e) => setLoyaltyPointsPerSar(parseInt(e.target.value) || 1)}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRTL
                      ? `العميل يحصل على ${loyaltyPointsPerSar} نقطة لكل ريال ينفقه`
                      : `Customer earns ${loyaltyPointsPerSar} point(s) per SAR spent`}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'قيمة النقطة (ريال)' : 'Point Value (SAR)'}</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={loyaltyRedemptionValue}
                    onChange={(e) => setLoyaltyRedemptionValue(parseFloat(e.target.value) || 0.10)}
                    placeholder="0.10"
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRTL
                      ? `100 نقطة = ${(100 * loyaltyRedemptionValue).toFixed(2)} ريال خصم`
                      : `100 points = SAR ${(100 * loyaltyRedemptionValue).toFixed(2)} discount`}
                  </p>
                </div>
              </div>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />
                ) : (
                  <Save className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                )}
                {t('common.save')}
              </Button>
            </>
          )}
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
            <Switch
              checked={isDarkMode}
              onCheckedChange={(checked) => setIsDarkMode(checked)}
            />
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
            <Switch
              checked={soundEnabled}
              onCheckedChange={(checked) => setSoundEnabled(checked)}
            />
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
