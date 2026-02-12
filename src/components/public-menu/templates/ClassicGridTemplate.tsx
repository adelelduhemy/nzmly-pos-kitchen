import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, ShoppingCart, Plus } from 'lucide-react';
import MenuHeader from '../MenuHeader';
import CategoryCard from '../CategoryCard';
import CategoryItemsView from '../CategoryItemsView';
import MenuFooter from '../MenuFooter';
import MenuChatbot from '../MenuChatbot';
import CartDrawer from '../CartDrawer';
import ItemDetailModal from '../ItemDetailModal';
import { usePublicCartStore } from '@/store/publicCartStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { toast } from 'sonner';

interface ClassicGridTemplateProps {
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

const ClassicGridTemplate = ({
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
}: ClassicGridTemplateProps) => {
  const isAr = lang === 'ar';
  const primaryColor = settings?.primary_color || '#2563EB';

  const [cartOpen, setCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const addItem = usePublicCartStore((s) => s.addItem);
  const cartCount = usePublicCartStore((s) => s.getItemCount());

  const visibleCategories = categories.filter((cat: any) => categoryItemCounts[cat.id] > 0);

  const categoryItems = selectedCategory
    ? menuItems.filter((item: any) => item.category_id === selectedCategory)
    : [];

  const selectedCategoryName = selectedCategory
    ? categories.find((c: any) => c.id === selectedCategory)?.[isAr ? 'name_ar' : 'name_en'] || ''
    : '';

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" dir={isAr ? 'rtl' : 'ltr'}>
      <AnimatePresence mode="wait">
        {selectedCategory ? (
          <CategoryItemsView
            key="items-view"
            categoryName={selectedCategoryName}
            items={categoryItems}
            lang={lang}
            primaryColor={primaryColor}
            onBack={() => onSelectCategory(null)}
            onItemClick={(item) => setSelectedItem(item)}
          />
        ) : (
          <motion.div
            key="categories-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MenuHeader
              logoUrl={settings?.logo_url}
              restaurantName={isAr ? settings?.restaurant_name_ar : settings?.restaurant_name_en}
              primaryColor={primaryColor}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              lang={lang}
              onToggleLang={onToggleLang}
            />

            <main className="max-w-6xl mx-auto px-4 py-6 pb-32">
              {/* Welcome Message */}
              {(settings?.welcome_message_ar || settings?.welcome_message_en) && !searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-2xl text-center"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
                    border: `1px solid ${primaryColor}20`,
                  }}
                >
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {isAr ? settings?.welcome_message_ar : settings?.welcome_message_en}
                  </p>
                </motion.div>
              )}

              {/* Search Results */}
              {searchResults ? (
                <div>
                  <h2 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">
                    {isAr ? `نتائج البحث (${searchResults.length})` : `Search Results (${searchResults.length})`}
                  </h2>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <ChefHat className="w-16 h-16 mx-auto mb-4 text-zinc-200" />
                      <p className="text-zinc-400">
                        {isAr ? 'لم يتم العثور على نتائج' : 'No results found'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map((item: any, index: number) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md overflow-hidden group cursor-pointer"
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="relative h-40 bg-zinc-100 dark:bg-zinc-800">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={isAr ? item.name_ar : item.name_en}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <ChefHat className="w-12 h-12 text-zinc-300" />
                              </div>
                            )}
                            {/* Quick Add */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => handleQuickAdd(e, item)}
                              className="absolute bottom-3 right-3 w-9 h-9 rounded-full shadow-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ backgroundColor: primaryColor }}
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-zinc-800 dark:text-white mb-1">
                              {isAr ? item.name_ar : item.name_en || item.name_ar}
                            </h3>
                            <div className="flex items-center justify-between">
                              {settings?.show_prices !== false && (
                                <p className="text-lg font-bold" style={{ color: primaryColor }}>
                                  {formatCurrency(item.price, lang)}
                                </p>
                              )}
                              <button
                                onClick={(e) => handleQuickAdd(e, item)}
                                className="px-3 py-1.5 rounded-lg text-white text-sm font-medium flex items-center gap-1"
                                style={{ backgroundColor: primaryColor }}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {isAr ? 'أضف' : 'Add'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Section Title */}
                  <h2 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">
                    {isAr ? 'الأقسام' : 'Categories'}
                  </h2>

                  {/* Categories Grid */}
                  {visibleCategories.length === 0 ? (
                    <div className="text-center py-16">
                      <ChefHat className="w-20 h-20 mx-auto mb-4 text-zinc-200" />
                      <p className="text-lg text-zinc-400">
                        {isAr ? 'لا توجد أقسام متاحة' : 'No categories available'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {visibleCategories.map((category: any, index: number) => (
                        <CategoryCard
                          key={category.id}
                          id={category.id}
                          name={isAr ? category.name_ar : category.name_en || category.name_ar}
                          imageUrl={category.image_url}
                          icon={category.icon}
                          itemCount={categoryItemCounts[category.id] || 0}
                          onClick={() => onSelectCategory(category.id)}
                          primaryColor={primaryColor}
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </main>

            <MenuFooter
              phone={settings?.phone}
              address={settings?.address}
              instagram={settings?.instagram}
              twitter={settings?.twitter}
            />
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

export default ClassicGridTemplate;
