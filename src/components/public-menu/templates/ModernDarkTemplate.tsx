import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Search, Globe, ArrowRight, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/formatCurrency';
import MenuChatbot from '../MenuChatbot';

interface ModernDarkTemplateProps {
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

const ModernDarkTemplate = ({
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
}: ModernDarkTemplateProps) => {
  const isAr = lang === 'ar';
  const primaryColor = settings?.primary_color || '#8B5CF6';

  const visibleCategories = categories.filter((cat: any) => categoryItemCounts[cat.id] > 0);

  const categoryItems = selectedCategory
    ? menuItems.filter((item: any) => item.category_id === selectedCategory)
    : [];

  const selectedCategoryData = selectedCategory
    ? categories.find((c: any) => c.id === selectedCategory)
    : null;

  const featuredItems = menuItems.filter((item: any) => item.is_featured);

  return (
    <div className="min-h-screen bg-zinc-950 text-white" dir={isAr ? 'rtl' : 'ltr'}>
      <AnimatePresence mode="wait">
        {selectedCategory ? (
          <motion.div
            key="items-view"
            initial={{ opacity: 0, x: isAr ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isAr ? 50 : -50 }}
            className="min-h-screen"
          >
            {/* Items Header */}
            <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800">
              <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectCategory(null)}
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  <h2 className="text-xl font-bold">
                    {isAr ? selectedCategoryData?.name_ar : selectedCategoryData?.name_en}
                  </h2>
                  <span className="text-sm text-zinc-500">
                    ({categoryItems.length} {isAr ? 'صنف' : 'items'})
                  </span>
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryItems.map((item: any, index: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="group flex gap-4 bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800 hover:border-zinc-700 transition-all"
                  >
                    <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-800">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={isAr ? item.name_ar : item.name_en}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-10 h-10 text-zinc-600" />
                        </div>
                      )}
                      {item.is_featured && (
                        <div className="absolute top-2 left-2 p-1 rounded-full bg-amber-500">
                          <Star className="w-3 h-3 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg">
                          {isAr ? item.name_ar : item.name_en || item.name_ar}
                        </h3>
                        {(item.description_ar || item.description_en) && (
                          <p className="text-sm text-zinc-400 line-clamp-2 mt-1">
                            {isAr ? item.description_ar : item.description_en}
                          </p>
                        )}
                      </div>
                      {settings?.show_prices !== false && (
                        <p className="text-xl font-bold mt-2" style={{ color: primaryColor }}>
                          {formatCurrency(item.price, lang)}
                        </p>
                      )}
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
            <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800">
              <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {settings?.logo_url ? (
                      <img
                        src={settings.logo_url}
                        alt="Logo"
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-zinc-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                        <ChefHat className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h1 className="font-bold text-lg">
                        {isAr ? settings?.restaurant_name_ar : settings?.restaurant_name_en}
                      </h1>
                      <p className="text-xs text-zinc-500">{isAr ? 'المنيو الرقمي' : 'Digital Menu'}</p>
                    </div>
                  </div>
                  <button
                    onClick={onToggleLang}
                    className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={isAr ? 'ابحث عن طبقك المفضل...' : 'Search for your favorite dish...'}
                    className="pl-10 bg-zinc-900 border-zinc-800 rounded-xl h-12 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
              {/* Featured Section */}
              {featuredItems.length > 0 && !searchQuery && (
                <section className="mb-8">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    {isAr ? 'الأكثر طلباً' : 'Most Popular'}
                  </h2>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {featuredItems.slice(0, 5).map((item: any, index: number) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex-shrink-0 w-44"
                      >
                        <div className="relative h-44 rounded-2xl overflow-hidden mb-3 bg-zinc-800">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={isAr ? item.name_ar : item.name_en}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ChefHat className="w-12 h-12 text-zinc-600" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <p className="font-bold text-sm truncate">
                              {isAr ? item.name_ar : item.name_en}
                            </p>
                            {settings?.show_prices !== false && (
                              <p className="text-sm font-bold" style={{ color: primaryColor }}>
                                {formatCurrency(item.price, lang)}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Categories - Horizontal Scroll */}
              <section>
                <h2 className="text-lg font-bold mb-4">{isAr ? 'الأقسام' : 'Categories'}</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {visibleCategories.map((category: any, index: number) => (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onSelectCategory(category.id)}
                      className="flex-shrink-0 w-36 h-40 rounded-2xl overflow-hidden relative group"
                    >
                      <div className="absolute inset-0 bg-zinc-800">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={isAr ? category.name_ar : category.name_en}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl">{category.icon || '🍽️'}</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-start">
                        <p className="font-bold text-sm">
                          {isAr ? category.name_ar : category.name_en || category.name_ar}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {categoryItemCounts[category.id]} {isAr ? 'صنف' : 'items'}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
            </main>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 py-4">
              <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-6 text-sm text-zinc-500">
                {settings?.phone && <span>{settings.phone}</span>}
                {settings?.instagram && <span>@{settings.instagram}</span>}
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chatbot */}
      <MenuChatbot lang={lang} primaryColor={primaryColor} />
    </div>
  );
};

export default ModernDarkTemplate;
