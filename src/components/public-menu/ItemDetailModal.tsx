import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChefHat, Star, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicCartStore } from '@/store/publicCartStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { toast } from 'sonner';

interface ItemDetailModalProps {
    item: {
        id: string;
        name_ar: string;
        name_en: string;
        description_ar: string | null;
        description_en: string | null;
        price: number;
        image_url: string | null;
        is_featured: boolean | null;
    } | null;
    isOpen: boolean;
    onClose: () => void;
    lang: 'ar' | 'en';
    primaryColor: string;
}

const ItemDetailModal = ({ item, isOpen, onClose, lang, primaryColor }: ItemDetailModalProps) => {
    const isAr = lang === 'ar';
    const addItem = usePublicCartStore((s) => s.addItem);
    const [quantity, setQuantity] = React.useState(1);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    React.useEffect(() => {
        setQuantity(1);
    }, [item]);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!mounted) return null;

    const handleAddToCart = () => {
        if (!item) return;
        for (let i = 0; i < quantity; i++) {
            addItem({
                id: item.id,
                name_ar: item.name_ar,
                name_en: item.name_en,
                price: item.price,
                image_url: item.image_url ?? undefined,
            });
        }
        toast.success(
            isAr
                ? `تمت إضافة ${item.name_ar} (${quantity}×)`
                : `${item.name_en || item.name_ar} (${quantity}×) added to cart`
        );
        onClose();
    };

    const name = item ? (isAr ? item.name_ar : item.name_en || item.name_ar) : '';
    const description = item ? (isAr
        ? item.description_ar || item.description_en
        : item.description_en || item.description_ar) : '';

    const modalContent = (
        <AnimatePresence>
            {isOpen && item && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-[9998]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto relative"
                            dir={isAr ? 'rtl' : 'ltr'}
                        >
                            {/* Close */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-10 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Image */}
                            <div className="relative h-56 md:h-64 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
                                {item.image_url ? (
                                    <img
                                        src={item.image_url}
                                        alt={name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <ChefHat className="w-20 h-20 text-zinc-300 dark:text-zinc-600" />
                                    </div>
                                )}
                                {item.is_featured && (
                                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-amber-400 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                        <Star className="w-4 h-4 fill-white" />
                                        {isAr ? 'مميز' : 'Featured'}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">{name}</h2>
                                    {description && (
                                        <p className="text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed text-sm">
                                            {description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                                        {formatCurrency(item.price * quantity, lang)}
                                    </p>
                                </div>

                                {/* Quantity + Add to Cart */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-2 py-1.5">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </button>
                                        <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <Button
                                        onClick={handleAddToCart}
                                        className="flex-1 h-14 text-lg gap-2 text-white rounded-xl shadow-lg shadow-blue-500/20"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        {isAr ? 'أضف للسلة' : 'Add to Cart'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default ItemDetailModal;
