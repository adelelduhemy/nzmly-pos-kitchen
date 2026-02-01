import React from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, Instagram, Twitter } from 'lucide-react';

interface MenuFooterProps {
  phone: string | null;
  address: string | null;
  instagram: string | null;
  twitter: string | null;
}

const MenuFooter = ({ phone, address, instagram, twitter }: MenuFooterProps) => {
  const hasAnyContact = phone || address || instagram || twitter;

  if (!hasAnyContact) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-zinc-200/50 dark:border-zinc-700/50"
      >
        <div className="flex items-center justify-center gap-3">
          {instagram && (
            <motion.a
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <Instagram className="w-5 h-5" />
            </motion.a>
          )}
          {twitter && (
            <motion.a
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              href={`https://twitter.com/${twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <Twitter className="w-5 h-5" />
            </motion.a>
          )}
          {address && (
            <motion.a
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <MapPin className="w-5 h-5" />
            </motion.a>
          )}
          {phone && (
            <motion.a
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              href={`tel:${phone}`}
              className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <Phone className="w-5 h-5" />
            </motion.a>
          )}
        </div>
        <p className="text-center text-xs text-zinc-400 mt-3">
          Powered by Nazmli
        </p>
      </motion.div>
    </footer>
  );
};

export default MenuFooter;
