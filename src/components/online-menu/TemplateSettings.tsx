import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Check, Palette, Layout, Eye, Type, Image } from 'lucide-react';
import ImageUpload from '@/components/menu/ImageUpload';

interface TemplateSettingsProps {
  isAr: boolean;
}

const TemplateSettings = ({ isAr }: TemplateSettingsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch restaurant settings
  const { data: settings } = useQuery({
    queryKey: ['restaurant_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .update(updates)
        .eq('id', settings?.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant_settings'] });
      toast({ title: isAr ? 'تم حفظ الإعدادات' : 'Settings saved' });
    },
    onError: (error: any) => {
      toast({ title: isAr ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const selectedTemplate = templates.find((t: any) => t.id === settings?.selected_template_id) 
    || templates.find((t: any) => t.is_default);

  const fontOptions = [
    { value: 'system', label: isAr ? 'خط النظام' : 'System Font' },
    { value: 'cairo', label: 'Cairo' },
    { value: 'tajawal', label: 'Tajawal' },
    { value: 'almarai', label: 'Almarai' },
    { value: 'inter', label: 'Inter' },
  ];

  const categoryLayoutOptions = [
    { value: 'grid', label: isAr ? 'شبكة' : 'Grid' },
    { value: 'list', label: isAr ? 'قائمة' : 'List' },
    { value: 'scroll', label: isAr ? 'تمرير أفقي' : 'Horizontal Scroll' },
  ];

  const getTemplatePreviewBg = (layoutType: string) => {
    switch (layoutType) {
      case 'modern_dark': return 'bg-zinc-900';
      case 'promo_focused': return 'bg-gradient-to-br from-red-500 to-orange-400';
      case 'minimal_fast': return 'bg-white border-2 border-zinc-200';
      default: return 'bg-gradient-to-br from-blue-50 to-zinc-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Template Selection */}
      <section>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Layout className="w-5 h-5" />
          {isAr ? 'اختيار التمبليت' : 'Choose Template'}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template: any) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-lg overflow-hidden ${
                selectedTemplate?.id === template.id 
                  ? 'ring-2 ring-primary ring-offset-2' 
                  : ''
              }`}
              onClick={() => updateSettingsMutation.mutate({ selected_template_id: template.id })}
            >
              <div className={`h-32 ${getTemplatePreviewBg(template.layout_type)} relative`}>
                {/* Simple visual preview */}
                <div className="absolute inset-4 flex flex-col justify-end">
                  {template.layout_type === 'classic_grid' && (
                    <div className="grid grid-cols-2 gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-4 bg-white/80 rounded" />
                      ))}
                    </div>
                  )}
                  {template.layout_type === 'modern_dark' && (
                    <div className="flex gap-1">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-8 w-12 bg-zinc-700 rounded" />
                      ))}
                    </div>
                  )}
                  {template.layout_type === 'promo_focused' && (
                    <div className="bg-white/20 rounded p-2 text-white text-center text-xs font-bold">
                      {isAr ? 'عروض' : 'PROMO'}
                    </div>
                  )}
                  {template.layout_type === 'minimal_fast' && (
                    <div className="space-y-1">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-2 bg-zinc-200 rounded w-full" />
                      ))}
                    </div>
                  )}
                </div>
                {selectedTemplate?.id === template.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h4 className="font-bold text-sm">{isAr ? template.name_ar : template.name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {isAr ? template.description_ar : template.description}
                </p>
                {template.is_default && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {isAr ? 'الافتراضي' : 'Default'}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Color Settings */}
      <section>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          {isAr ? 'الألوان' : 'Colors'}
        </h3>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? 'اللون الأساسي' : 'Primary Color'}</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    type="color"
                    value={settings?.primary_color || '#2563EB'}
                    onChange={(e) => updateSettingsMutation.mutate({ primary_color: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input 
                    value={settings?.primary_color || '#2563EB'}
                    onChange={(e) => updateSettingsMutation.mutate({ primary_color: e.target.value })}
                    className="flex-1"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <Label>{isAr ? 'اللون الثانوي' : 'Secondary Color'}</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    type="color"
                    value={settings?.secondary_color || '#1e40af'}
                    onChange={(e) => updateSettingsMutation.mutate({ secondary_color: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input 
                    value={settings?.secondary_color || '#1e40af'}
                    onChange={(e) => updateSettingsMutation.mutate({ secondary_color: e.target.value })}
                    className="flex-1"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Branding */}
      <section>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Image className="w-5 h-5" />
          {isAr ? 'الهوية البصرية' : 'Branding'}
        </h3>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="mb-2 block">{isAr ? 'شعار المطعم' : 'Restaurant Logo'}</Label>
                <ImageUpload
                  value={settings?.logo_url}
                  onChange={(url) => updateSettingsMutation.mutate({ logo_url: url })}
                />
              </div>
              <div>
                <Label className="mb-2 block">{isAr ? 'صورة البانر' : 'Banner Image'}</Label>
                <ImageUpload
                  value={settings?.banner_url}
                  onChange={(url) => updateSettingsMutation.mutate({ banner_url: url })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Typography */}
      <section>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Type className="w-5 h-5" />
          {isAr ? 'الخطوط والتخطيط' : 'Typography & Layout'}
        </h3>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? 'نوع الخط' : 'Font Family'}</Label>
                <Select
                  value={settings?.font_family || 'system'}
                  onValueChange={(v) => updateSettingsMutation.mutate({ font_family: v })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? 'شكل عرض الأقسام' : 'Category Layout'}</Label>
                <Select
                  value={settings?.category_layout || 'grid'}
                  onValueChange={(v) => updateSettingsMutation.mutate({ category_layout: v })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryLayoutOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Visibility Options */}
      <section>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          {isAr ? 'خيارات العرض' : 'Display Options'}
        </h3>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label>{isAr ? 'إظهار الأسعار' : 'Show Prices'}</Label>
              <Switch
                checked={settings?.show_prices !== false}
                onCheckedChange={(v) => updateSettingsMutation.mutate({ show_prices: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{isAr ? 'إظهار العروض' : 'Show Offers'}</Label>
              <Switch
                checked={settings?.show_offers !== false}
                onCheckedChange={(v) => updateSettingsMutation.mutate({ show_offers: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{isAr ? 'إظهار التقييمات' : 'Show Ratings'}</Label>
              <Switch
                checked={settings?.show_ratings === true}
                onCheckedChange={(v) => updateSettingsMutation.mutate({ show_ratings: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{isAr ? 'إظهار زر الطلب' : 'Show Order Button'}</Label>
              <Switch
                checked={settings?.show_order_button !== false}
                onCheckedChange={(v) => updateSettingsMutation.mutate({ show_order_button: v })}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Preview Button */}
      {settings?.menu_slug && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.open(`/menu/${settings.menu_slug}`, '_blank')}
            className="gap-2"
          >
            <Eye className="w-5 h-5" />
            {isAr ? 'معاينة المنيو' : 'Preview Menu'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TemplateSettings;
