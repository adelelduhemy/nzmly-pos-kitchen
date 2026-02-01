import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { ChefHat } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ClassicGridTemplate,
  ModernDarkTemplate,
  PromoFocusedTemplate,
  MinimalFastTemplate,
} from '@/components/public-menu/templates';

const PublicMenu = () => {
  const { slug } = useParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch restaurant settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['public_restaurant_settings', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('menu_slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch template info
  const { data: templates = [] } = useQuery({
    queryKey: ['public_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!settings,
  });

  // Fetch menu items
  const { data: menuItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['public_menu_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!settings,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['public_menu_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!settings,
  });

  const isAr = lang === 'ar';

  // Calculate item counts per category
  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    menuItems.forEach((item: any) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [menuItems]);

  // Determine which template to use
  const selectedTemplate = useMemo(() => {
    if (!settings?.selected_template_id) {
      return templates.find((t: any) => t.is_default) || templates[0];
    }
    return templates.find((t: any) => t.id === settings.selected_template_id);
  }, [settings, templates]);

  if (settingsLoading || itemsLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto p-4 space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!settings || !settings.is_menu_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl max-w-sm"
        >
          <ChefHat className="w-16 h-16 mx-auto mb-4 text-zinc-300" />
          <h1 className="text-2xl font-bold mb-2 text-zinc-800 dark:text-white">
            {isAr ? 'المنيو غير متاح' : 'Menu Not Available'}
          </h1>
          <p className="text-zinc-500">
            {isAr ? 'عذراً، المنيو غير متاح حالياً' : 'Sorry, this menu is currently unavailable'}
          </p>
        </motion.div>
      </div>
    );
  }

  // Shared props for all templates
  const templateProps = {
    settings,
    categories,
    menuItems,
    categoryItemCounts,
    lang,
    searchQuery,
    selectedCategory,
    onSearchChange: setSearchQuery,
    onToggleLang: () => setLang(lang === 'ar' ? 'en' : 'ar'),
    onSelectCategory: setSelectedCategory,
  };

  // Render the appropriate template
  const layoutType = selectedTemplate?.layout_type || 'classic_grid';

  switch (layoutType) {
    case 'modern_dark':
      return <ModernDarkTemplate {...templateProps} />;
    case 'promo_focused':
      return <PromoFocusedTemplate {...templateProps} />;
    case 'minimal_fast':
      return <MinimalFastTemplate {...templateProps} />;
    case 'classic_grid':
    default:
      return <ClassicGridTemplate {...templateProps} />;
  }
};

export default PublicMenu;
