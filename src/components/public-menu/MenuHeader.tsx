import React from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, ChefHat } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface MenuHeaderProps {
  logoUrl: string | null;
  restaurantName: string;
  primaryColor: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  lang: 'ar' | 'en';
  onToggleLang: () => void;
}

const MenuHeader = ({
  logoUrl,
  restaurantName,
  primaryColor,
  searchQuery,
  onSearchChange,
  lang,
  onToggleLang,
}: MenuHeaderProps) => {
  const isAr = lang === 'ar';

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Logo & Name Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <motion.img
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                src={logoUrl}
                alt="Logo"
                className="w-14 h-14 rounded-2xl object-cover shadow-lg ring-2 ring-white/50 dark:ring-zinc-800/50"
              />
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center ring-2 ring-white/50 dark:ring-zinc-800/50"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
              >
                <ChefHat className="w-7 h-7 text-white" />
              </motion.div>
            )}
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                {restaurantName}
              </h1>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleLang}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Globe className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input
            type="text"
            placeholder={isAr ? 'ابحث عن صنف...' : 'Search for items...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pr-10 pl-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 focus:ring-2 text-base"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>
      </div>
    </header>
  );
};

export default MenuHeader;
