import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Search, Globe, ArrowRight, ChevronLeft, ShoppingCart, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/formatCurrency';
import MenuChatbot from '../MenuChatbot';
import CartDrawer from '../CartDrawer';
import ItemDetailModal from '../ItemDetailModal';
import { usePublicCartStore } from '@/store/publicCartStore';
import { toast } from 'sonner';

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

  const [cartOpen, setCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const addItem = usePublicCartStore((s) => s.addItem);
  const cartCount = usePublicCartStore((s) => s.getItemCount());

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

  const handleQuickAdd = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    addItem({
      id: item.id,
      name_ar: item.name_ar,
      name_en: item.name_en,
      price: item.price,
      image_url: item.image_url ?? undefined,
    });
    toast.success(isAr ? `تمت إضافة ${item.name_ar}` : `${item.name_en || item.name_ar} added`);
  };

  const renderItemRow = (item: any, index: number) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center justify-between px-4 py-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
      onClick={() => setSelectedItem(item)}
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
      <div className="flex items-center gap-3">
        {settings?.show_prices !== false && (
          <p className="font-bold text-lg" style={{ color: primaryColor }}>
            {formatCurrency(item.price, lang)}
          </p>
        )}
        <button
          onClick={(e) => handleQuickAdd(e, item)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

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

            {/* Items List */}
            <div className="max-w-2xl mx-auto pb-32">
              {categoryItems.map((item: any, index: number) => renderItemRow(item, index))}
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

            <main className="max-w-2xl mx-auto pb-32">
              {/* Search Results */}
              {searchResults ? (
                <div>
                  <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-500">
                    {searchResults.length} {isAr ? 'نتيجة' : 'results'}
                  </div>
                  {searchResults.map((item: any, index: number) => renderItemRow(item, index))}
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

            {/* Footer */}
            <footer className="mt-8 py-6 text-center text-sm text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
              <p>{settings?.phone}</p>
              <p className="mt-1">{isAr ? 'مدعوم من نظملي' : 'Powered by Nazmli'}</p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Badge */}
      {cartCount > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCartOpen(true)}
          className={`fixed z-40 p-4 rounded-full shadow-2xl text-white ${isAr ? 'right-4 bottom-20' : 'left-4 bottom-20'}`}
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {cartCount}
          </span>
        </motion.button>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        lang={lang}
        primaryColor={primaryColor}
        phone={settings?.phone}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        lang={lang}
        primaryColor={primaryColor}
      />

      {/* AI Chatbot */}
      <MenuChatbot lang={lang} primaryColor={primaryColor} menuSlug={settings?.menu_slug} />
    </div>
  );
};

export default MinimalFastTemplate;
