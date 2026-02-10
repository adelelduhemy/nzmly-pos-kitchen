import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Search, Globe, ArrowRight, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/formatCurrency';
import MenuChatbot from '../MenuChatbot';

interface MinimalFastTemplateProps {
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

const MinimalFastTemplate = ({
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
}: MinimalFastTemplateProps) => {
  const isAr = lang === 'ar';
  const primaryColor = settings?.primary_color || '#10B981';

  const visibleCategories = categories.filter((cat: any) => categoryItemCounts[cat.id] > 0);

  const categoryItems = selectedCategory
    ? menuItems.filter((item: any) => item.category_id === selectedCategory)
    : [];

  const selectedCategoryData = selectedCategory
    ? categories.find((c: any) => c.id === selectedCategory)
    : null;

  const searchResults = searchQuery.trim()
    ? menuItems.filter((item: any) =>
      item.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name_en?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : null;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950" dir={isAr ? 'rtl' : 'ltr'}>
      <AnimatePresence mode="wait">
        {selectedCategory ? (
          <motion.div
            key="items-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            {/* Items Header */}
            <div className="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
              <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                <button
                  onClick={() => onSelectCategory(null)}
                  className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-lg">
                  {isAr ? selectedCategoryData?.name_ar : selectedCategoryData?.name_en}
                </h2>
                <span className="text-sm text-zinc-400">({categoryItems.length})</span>
              </div>
            </div>

            {/* Items List - Simple */}
            <div className="max-w-2xl mx-auto">
              {categoryItems.map((item: any, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between px-4 py-4 border-b border-zinc-100 dark:border-zinc-800"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-zinc-900 dark:text-white">
                      {isAr ? item.name_ar : item.name_en || item.name_ar}
                    </h3>
                    {(item.description_ar || item.description_en) && (
                      <p className="text-sm text-zinc-500 mt-0.5 line-clamp-1">
                        {isAr ? item.description_ar : item.description_en}
                      </p>
                    )}
                  </div>
                  {settings?.show_prices !== false && (
                    <p className="font-bold text-lg" style={{ color: primaryColor }}>
                      {formatCurrency(item.price, lang)}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="main-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header - Minimal */}
            <header className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
              <div className="max-w-2xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {settings?.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                        <ChefHat className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="font-bold text-lg">
                      {isAr ? settings?.restaurant_name_ar : settings?.restaurant_name_en}
                    </span>
                  </div>
                  <button onClick={onToggleLang} className="text-sm font-medium" style={{ color: primaryColor }}>
                    {lang === 'ar' ? 'EN' : 'عربي'}
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={isAr ? 'بحث سريع...' : 'Quick search...'}
                    className="pl-9 h-10 bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg"
                  />
                </div>
              </div>
            </header>

            <main className="max-w-2xl mx-auto">
              {/* Search Results */}
              {searchResults ? (
                <div>
                  <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-500">
                    {searchResults.length} {isAr ? 'نتيجة' : 'results'}
                  </div>
                  {searchResults.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-4 border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <div>
                        <p className="font-medium">{isAr ? item.name_ar : item.name_en}</p>
                      </div>
                      {settings?.show_prices !== false && (
                        <p className="font-bold" style={{ color: primaryColor }}>
                          {formatCurrency(item.price, lang)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Categories - List Style */}
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {visibleCategories.map((category: any, index: number) => (
                      <motion.button
                        key={category.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => onSelectCategory(category.id)}
                        className="w-full flex items-center justify-between px-4 py-5 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{category.icon || '🍽️'}</span>
                          <div className="text-start">
                            <p className="font-semibold text-zinc-900 dark:text-white">
                              {isAr ? category.name_ar : category.name_en || category.name_ar}
                            </p>
                            <p className="text-sm text-zinc-500">
                              {categoryItemCounts[category.id]} {isAr ? 'صنف' : 'items'}
                            </p>
                          </div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-zinc-400 rotate-180 rtl:rotate-0" />
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </main>

            {/* Footer - Simple */}
            <footer className="mt-8 py-6 text-center text-sm text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
              <p>{settings?.phone}</p>
              <p className="mt-1">{isAr ? 'مدعوم من نظملي' : 'Powered by Nazmli'}</p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chatbot */}
      <MenuChatbot lang={lang} primaryColor={primaryColor} />
    </div>
  );
};

export default MinimalFastTemplate;
