import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Search, Globe, ArrowRight, ShoppingBag, Percent, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatCurrency';
import MenuChatbot from '../MenuChatbot';

interface PromoFocusedTemplateProps {
  settings: any;
  categories: any[];
  menuItems: any[];
  categoryItemCounts: Record<string, number>;
  lang: 'ar' | 'en';
  searchQuery: string;
  selectedCategory: string | null;
  onSearchChange: (query: string) => void;
  onToggleLang: () => void;
  onSelectCategory: (id: string | null) => void;
}

const PromoFocusedTemplate = ({
  settings,
  categories,
  menuItems,
  categoryItemCounts,
  lang,
  searchQuery,
  selectedCategory,
  onSearchChange,
  onToggleLang,
  onSelectCategory,
}: PromoFocusedTemplateProps) => {
  const isAr = lang === 'ar';
  const primaryColor = settings?.primary_color || '#EF4444';
  const secondaryColor = settings?.secondary_color || '#F97316';

  const visibleCategories = categories.filter((cat: any) => categoryItemCounts[cat.id] > 0);
  
  const categoryItems = selectedCategory 
    ? menuItems.filter((item: any) => item.category === selectedCategory)
    : [];

  const selectedCategoryData = selectedCategory
    ? categories.find((c: any) => c.id === selectedCategory)
    : null;

  const featuredItems = menuItems.filter((item: any) => item.is_featured);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950" dir={isAr ? 'rtl' : 'ltr'}>
      <AnimatePresence mode="wait">
        {selectedCategory ? (
          <motion.div
            key="items-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen"
          >
            {/* Items Header */}
            <div className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-sm">
              <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectCategory(null)}
                    className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  <h2 className="text-xl font-bold">
                    {isAr ? selectedCategoryData?.name_ar : selectedCategoryData?.name_en}
                  </h2>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
              <div className="space-y-4">
                {categoryItems.map((item: any, index: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: isAr ? 30 : -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl"
                  >
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={isAr ? item.name_ar : item.name_en}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-8 h-8 text-zinc-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-zinc-900 dark:text-white">
                            {isAr ? item.name_ar : item.name_en || item.name_ar}
                          </h3>
                          {(item.description_ar || item.description_en) && (
                            <p className="text-sm text-zinc-500 line-clamp-2 mt-1">
                              {isAr ? item.description_ar : item.description_en}
                            </p>
                          )}
                        </div>
                        {item.is_featured && (
                          <Badge className="gap-1 bg-amber-500">
                            <Star className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        {settings?.show_prices !== false && (
                          <p className="text-xl font-bold" style={{ color: primaryColor }}>
                            {formatCurrency(item.price, lang)}
                          </p>
                        )}
                        {settings?.show_order_button !== false && (
                          <Button 
                            size="sm" 
                            className="gap-1 rounded-full"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <ShoppingBag className="w-4 h-4" />
                            {isAr ? 'أضف' : 'Add'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="main-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl shadow-sm">
              <div className="max-w-6xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings?.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                        <ChefHat className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <span className="font-bold">
                      {isAr ? settings?.restaurant_name_ar : settings?.restaurant_name_en}
                    </span>
                  </div>
                  <button onClick={onToggleLang} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Globe className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </header>

            <main className="max-w-6xl mx-auto">
              {/* Hero Banner */}
              {settings?.banner_url && settings?.show_offers !== false && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative h-48 md:h-64 mx-4 mt-4 rounded-3xl overflow-hidden"
                >
                  <img 
                    src={settings.banner_url} 
                    alt="Promo Banner" 
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}CC, ${secondaryColor}99)` }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                    <Percent className="w-12 h-12 mb-2" />
                    <h2 className="text-2xl font-bold">{isAr ? 'عروض اليوم' : "Today's Offers"}</h2>
                    <p className="text-white/90">{isAr ? 'خصم 20% على جميع الوجبات' : '20% off on all meals'}</p>
                    {settings?.show_order_button !== false && (
                      <Button 
                        className="mt-4 rounded-full px-6"
                        style={{ backgroundColor: 'white', color: primaryColor }}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        {isAr ? 'اطلب الآن' : 'Order Now'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Search */}
              <div className="px-4 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={isAr ? 'ابحث...' : 'Search...'}
                    className="pl-10 rounded-full h-12 border-2"
                    style={{ borderColor: `${primaryColor}30` }}
                  />
                </div>
              </div>

              {/* Featured Items */}
              {featuredItems.length > 0 && !searchQuery && (
                <section className="px-4 pb-6">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5" style={{ color: primaryColor }} />
                    {isAr ? 'الأكثر طلباً' : 'Best Sellers'}
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {featuredItems.slice(0, 6).map((item: any) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        className="flex-shrink-0 w-40 bg-zinc-50 dark:bg-zinc-900 rounded-2xl overflow-hidden"
                      >
                        <div className="h-28 bg-zinc-200 dark:bg-zinc-800">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ChefHat className="w-10 h-10 text-zinc-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-sm truncate">{isAr ? item.name_ar : item.name_en}</p>
                          {settings?.show_prices !== false && (
                            <p className="text-sm font-bold" style={{ color: primaryColor }}>
                              {formatCurrency(item.price, lang)}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Categories */}
              <section className="px-4 pb-32">
                <h2 className="text-lg font-bold mb-4">{isAr ? 'الأقسام' : 'Categories'}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {visibleCategories.map((category: any, index: number) => (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectCategory(category.id)}
                      className="relative aspect-square rounded-3xl overflow-hidden shadow-lg"
                    >
                      <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={isAr ? category.name_ar : category.name_en}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl">{category.icon || '🍽️'}</span>
                          </div>
                        )}
                      </div>
                      <div 
                        className="absolute inset-0"
                        style={{ background: `linear-gradient(to top, ${primaryColor}DD, transparent 60%)` }}
                      />
                      <div className="absolute bottom-4 left-4 right-4 text-white text-start">
                        <p className="font-bold text-lg">
                          {isAr ? category.name_ar : category.name_en || category.name_ar}
                        </p>
                        <p className="text-sm text-white/80">
                          {categoryItemCounts[category.id]} {isAr ? 'صنف' : 'items'}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
            </main>

            {/* Fixed Order Button */}
            {settings?.show_order_button !== false && (
              <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto">
                <Button 
                  className="w-full h-14 rounded-full text-lg font-bold shadow-2xl gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {isAr ? 'اطلب الآن' : 'Order Now'}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chatbot */}
      <MenuChatbot lang={lang} primaryColor={primaryColor} />
    </div>
  );
};

export default PromoFocusedTemplate;
