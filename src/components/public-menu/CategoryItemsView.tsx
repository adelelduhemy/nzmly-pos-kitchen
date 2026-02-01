import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChefHat, Star } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface MenuItem {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  image_url: string | null;
  is_featured: boolean | null;
}

interface CategoryItemsViewProps {
  categoryName: string;
  items: MenuItem[];
  lang: 'ar' | 'en';
  primaryColor: string;
  onBack: () => void;
}

const CategoryItemsView = ({
  categoryName,
  items,
  lang,
  primaryColor,
  onBack,
}: CategoryItemsViewProps) => {
  const isAr = lang === 'ar';

  return (
    <motion.div
      initial={{ opacity: 0, x: isAr ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isAr ? 50 : -50 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </motion.button>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {categoryName}
            </h2>
            <span className="text-sm text-zinc-500">
              ({items.length} {isAr ? 'صنف' : 'items'})
            </span>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <ChefHat className="w-20 h-20 mx-auto mb-4 text-zinc-200 dark:text-zinc-700" />
              <p className="text-lg text-zinc-400">
                {isAr ? 'لا توجد أصناف في هذا القسم' : 'No items in this category'}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={isAr ? item.name_ar : item.name_en}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ChefHat className="w-16 h-16 text-zinc-300 dark:text-zinc-600" />
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      {item.is_featured && (
                        <div className="absolute top-3 left-3">
                          <div className="p-1.5 rounded-full bg-amber-400 shadow-lg">
                            <Star className="w-4 h-4 text-white fill-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-zinc-800 dark:text-zinc-100 mb-1 line-clamp-1">
                        {isAr ? item.name_ar : item.name_en || item.name_ar}
                      </h3>
                      {(item.description_ar || item.description_en) && (
                        <p className="text-sm text-zinc-500 line-clamp-2 mb-3 min-h-[2.5rem]">
                          {isAr ? item.description_ar : item.description_en || item.description_ar}
                        </p>
                      )}
                      <p
                        className="text-xl font-bold"
                        style={{ color: primaryColor }}
                      >
                        {formatCurrency(item.price, lang)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CategoryItemsView;
