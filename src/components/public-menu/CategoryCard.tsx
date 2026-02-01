import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat } from 'lucide-react';

interface CategoryCardProps {
  id: string;
  name: string;
  imageUrl: string | null;
  icon: string | null;
  itemCount: number;
  isNew?: boolean;
  isPopular?: boolean;
  onClick: () => void;
  primaryColor: string;
  index: number;
}

const CategoryCard = ({
  name,
  imageUrl,
  icon,
  itemCount,
  isNew,
  isPopular,
  onClick,
  primaryColor,
  index,
}: CategoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        {/* Background Image */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)` }}
          >
            {icon ? (
              <span className="text-6xl">{icon}</span>
            ) : (
              <ChefHat className="w-16 h-16 text-zinc-300 dark:text-zinc-600" />
            )}
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {isNew && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg">
              جديد
            </span>
          )}
          {isPopular && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-lg">
              الأكثر طلباً
            </span>
          )}
        </div>

        {/* Category Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-bold text-white mb-1 drop-shadow-lg">
            {name}
          </h3>
          {itemCount > 0 && (
            <p className="text-sm text-white/80">
              {itemCount} صنف
            </p>
          )}
        </div>

        {/* Hover Border Effect */}
        <div
          className="absolute inset-0 rounded-2xl border-3 border-transparent group-hover:border-white/30 transition-colors duration-300"
          style={{ borderColor: 'transparent' }}
        />
      </div>
    </motion.div>
  );
};

export default CategoryCard;
