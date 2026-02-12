import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingCart, MessageCircle, MapPin, User, Phone, ChevronLeft, Store, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { usePublicCartStore } from '@/store/publicCartStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCreateOnlineOrder } from '@/hooks/useCreateOnlineOrder';
import { useLoyaltyBalance } from '@/hooks/useLoyaltyBalance';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    lang: 'ar' | 'en';
    primaryColor: string;
    phone?: string;
}

const CartDrawer = ({ isOpen, onClose, lang, primaryColor, phone }: CartDrawerProps) => {
    const isAr = lang === 'ar';
    const items = usePublicCartStore((s) => s.items);
    const updateQuantity = usePublicCartStore((s) => s.updateQuantity);
    const removeItem = usePublicCartStore((s) => s.removeItem);
    const clearCart = usePublicCartStore((s) => s.clearCart);
    const getTotal = usePublicCartStore((s) => s.getTotal);
    const getItemCount = usePublicCartStore((s) => s.getItemCount);
    const [mounted, setMounted] = useState(false);

    // Checkout State
    const [view, setView] = useState<'cart' | 'checkout'>('cart');
    const [name, setName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [address, setAddress] = useState('');
    const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('delivery');
    const [notes, setNotes] = useState('');

    // Loyalty State
    const [redeemPoints, setRedeemPoints] = useState(false);
    const { data: loyaltyData, isLoading: isLoadingLoyalty, refetch: checkLoyalty } = useLoyaltyBalance(customerPhone);

    const createOrder = useCreateOnlineOrder();

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Reset view when closed
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setView('cart');
                setRedeemPoints(false);
            }, 300);
        }
    }, [isOpen]);

    // Calculations
    const subtotal = getTotal();
    const vat = subtotal * 0.15;
    const grossTotal = subtotal + vat;

    // Loyalty Discount Logic
    let loyaltyDiscount = 0;
    let pointsToRedeem = 0;

    if (redeemPoints && loyaltyData?.exists && loyaltyData.points > 0) {
        // Calculate max redeemable amount (cannot exceed total)
        // The backend does `discount = points * rate`
        // We need to limit `points` so `discount <= grossTotal`

        const maxDiscountValue = loyaltyData.max_discount;

        if (maxDiscountValue >= grossTotal) {
            // Can cover full amount
            loyaltyDiscount = grossTotal;
            pointsToRedeem = Math.ceil(grossTotal / loyaltyData.redemption_rate);
        } else {
            // Partial coverage
            loyaltyDiscount = maxDiscountValue;
            pointsToRedeem = loyaltyData.points;
        }
    }

    const finalTotal = grossTotal - loyaltyDiscount;

    const handleSubmitOrder = async () => {
        if (!name || !customerPhone) return;

        const orderItems = items.map(item => ({
            menuItemId: item.id,
            dishName: (isAr ? item.name_ar : item.name_en) || item.name_en || item.name_ar || 'Unknown Item',
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            notes: ''
        }));

        try {
            await createOrder.mutateAsync({
                p_customer_name: name,
                p_customer_phone: customerPhone,
                p_customer_address: orderType === 'delivery' ? address : '',
                p_order_type: orderType,
                p_payment_method: 'cash',
                p_subtotal: subtotal,
                p_vat: vat,
                p_total: grossTotal,
                p_items: orderItems,
                p_notes: notes,
                p_redeemed_points: pointsToRedeem // Pass redeemed points
            });

            clearCart();
            onClose();
            setView('cart');
            setName('');
            setCustomerPhone('');
            setAddress('');
            setNotes('');
            setRedeemPoints(false);
        } catch (error) {
            // handled by hook
        }
    };

    const handleWhatsAppFallback = () => {
        if (!phone) return;
        const header = isAr ? '🛒 طلب جديد من المنيو الإلكتروني' : '🛒 New order from online menu';
        const itemLines = items
            .map(
                (item) =>
                    `• ${isAr ? item.name_ar : item.name_en} × ${item.quantity} = ${formatCurrency(item.price * item.quantity, lang)}`
            )
            .join('\n');
        const footer = isAr
            ? `\nالمجموع: ${formatCurrency(subtotal, lang)}\nالضريبة: ${formatCurrency(vat, lang)}\nالإجمالي: ${formatCurrency(grossTotal, lang)}`
            : `\nSubtotal: ${formatCurrency(subtotal, lang)}\nVAT: ${formatCurrency(vat, lang)}\nTotal: ${formatCurrency(grossTotal, lang)}`;

        const cleanPhone = phone.replace(/\D/g, '');
        const text = encodeURIComponent(`${header}\n\n${itemLines}\n${footer}`);
        window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    };

    if (!mounted) return null;

    const drawerContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[9998]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: isAr ? '-100%' : '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: isAr ? '-100%' : '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className={`fixed top-0 bottom-0 ${isAr ? 'left-0' : 'right-0'} w-full max-w-md bg-white dark:bg-zinc-900 z-[9999] shadow-2xl flex flex-col`}
                        dir={isAr ? 'rtl' : 'ltr'}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-5 py-4 text-white shrink-0"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <div className="flex items-center gap-2">
                                {view === 'checkout' && (
                                    <button onClick={() => setView('cart')} className="hover:bg-white/20 p-1 rounded-full transition-colors mr-2">
                                        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                                    </button>
                                )}
                                {view === 'cart' ? <ShoppingCart className="w-5 h-5" /> : (orderType === 'delivery' ? <MapPin className="w-5 h-5" /> : <Store className="w-5 h-5" />)}
                                <span className="font-bold text-lg">
                                    {view === 'cart' ? (isAr ? 'سلة الطلبات' : 'Your Cart') : (isAr ? 'إتمام الطلب' : 'Checkout')}
                                </span>
                                {view === 'cart' && (
                                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                                        {getItemCount()}
                                    </span>
                                )}
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-5">

                            {/* CART VIEW */}
                            {view === 'cart' && (
                                <div className="space-y-3 h-full flex flex-col">
                                    {items.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                                            <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
                                            <p className="text-lg font-medium">
                                                {isAr ? 'السلة فارغة' : 'Cart is empty'}
                                            </p>
                                            <p className="text-sm mt-1">
                                                {isAr ? 'أضف أصناف من المنيو' : 'Add items from the menu'}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {items.map((item) => (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3"
                                                >
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={isAr ? item.name_ar : item.name_en}
                                                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                                                            <span className="text-xl">🍽️</span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-zinc-800 dark:text-white text-sm truncate">
                                                            {isAr ? item.name_ar : item.name_en}
                                                        </p>
                                                        <p className="text-sm font-bold" style={{ color: primaryColor }}>
                                                            {formatCurrency(item.price * item.quantity, lang)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-colors"
                                                            style={{ backgroundColor: primaryColor }}
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                            <button
                                                onClick={clearCart}
                                                className="w-full text-sm text-red-500 hover:text-red-700 py-2 transition-colors mt-auto"
                                            >
                                                {isAr ? 'مسح السلة' : 'Clear Cart'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* CHECKOUT VIEW */}
                            {view === 'checkout' && (
                                <div className="space-y-6">
                                    {/* Order Type Tabs */}
                                    <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="delivery">{isAr ? 'توصيل' : 'Delivery'}</TabsTrigger>
                                            <TabsTrigger value="takeaway">{isAr ? 'استلام' : 'Pickup'}</TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    {/* Customer Details */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <User className="w-4 h-4 text-zinc-500" />
                                                {isAr ? 'الاسم' : 'Name'} <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder={isAr ? 'الاسم الكامل' : 'Full Name'}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-zinc-500" />
                                                {isAr ? 'رقم الهاتف' : 'Phone Number'} <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={customerPhone}
                                                    onChange={(e) => {
                                                        setCustomerPhone(e.target.value);
                                                        if (e.target.value.length < 8) setRedeemPoints(false);
                                                    }}
                                                    placeholder="05xxxxxxxx"
                                                    type="tel"
                                                    className="flex-1"
                                                />
                                                {customerPhone.length >= 8 && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => checkLoyalty()}
                                                        disabled={isLoadingLoyalty}
                                                        type="button"
                                                        style={{ borderColor: primaryColor, color: primaryColor }}
                                                    >
                                                        {isLoadingLoyalty ? '...' : (isAr ? 'النقاط' : 'Points')}
                                                    </Button>
                                                )}
                                            </div>
                                            {/* Loyalty Status Message */}
                                            {loyaltyData && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                                    className="text-xs flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 p-2 rounded-md"
                                                >
                                                    <span className={loyaltyData.exists ? 'text-green-600' : 'text-zinc-500'}>
                                                        {loyaltyData.exists
                                                            ? (isAr ? `رصيدك: ${loyaltyData.points} نقطة` : `Balance: ${loyaltyData.points} pts`)
                                                            : (isAr ? 'عميل جديد (سوف تكسب نقاط!)' : 'New customer (You will earn points!)')
                                                        }
                                                        {loyaltyData.name && <span className="block text-zinc-400 text-[10px]">{isAr ? `مرحباً ${loyaltyData.name}` : `Hi ${loyaltyData.name}`}</span>}
                                                    </span>


                                                </motion.div>
                                            )}
                                            {/* Fix: leaderData typo in logic above */}
                                            {loyaltyData?.exists && loyaltyData.points > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 p-2 rounded-md mt-1"
                                                >
                                                    <div className="text-xs">
                                                        <span className="font-bold text-green-600">{loyaltyData.points} {isAr ? 'نقطة' : 'pts'}</span>
                                                        <span className="mx-1 text-zinc-400">|</span>
                                                        <span className="text-zinc-500">{isAr ? 'قيمة الخصم:' : 'Value:'} {formatCurrency(loyaltyData.points * loyaltyData.redemption_rate, lang)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 scale-90">
                                                        <label htmlFor="redeem-switch" className="text-xs font-semibold cursor-pointer">
                                                            {isAr ? 'خصم' : 'Redeem'}
                                                        </label>
                                                        <Switch
                                                            id="redeem-switch"
                                                            checked={redeemPoints}
                                                            onCheckedChange={setRedeemPoints}
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        {orderType === 'delivery' && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-zinc-500" />
                                                    {isAr ? 'العنوان' : 'Address'} <span className="text-red-500">*</span>
                                                </label>
                                                <Textarea
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    placeholder={isAr ? 'تفاصيل العنوان...' : 'Delivery address details...'}
                                                    className="min-h-[80px]"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {isAr ? 'ملاحظات' : 'Notes'}
                                            </label>
                                            <Textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder={isAr ? 'أية ملاحظات إضافية...' : 'Any extra notes...'}
                                                className="min-h-[60px]"
                                            />
                                        </div>
                                    </div>

                                    {/* Payment Info */}
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                                        {orderType === 'delivery'
                                            ? (isAr ? 'الدفع عند الاستلام (نقداً)' : 'Payment: Cash on Delivery')
                                            : (isAr ? 'الدفع عند الاستلام في الفرع' : 'Payment: Pay at Restaurant')
                                        }
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer / Totals */}
                        {items.length > 0 && (
                            <div className="border-t border-zinc-200 dark:border-zinc-700 p-5 space-y-3 shrink-0 bg-white dark:bg-zinc-900">
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                                        <span>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                        <span>{formatCurrency(subtotal, lang)}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                                        <span>{isAr ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}</span>
                                        <span>{formatCurrency(vat, lang)}</span>
                                    </div>

                                    {/* Loyalty Discount Line */}
                                    {loyaltyDiscount > 0 && (
                                        <div className="flex justify-between text-green-600 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Gift className="w-3 h-3" />
                                                {isAr ? 'خصم نقاط الولاء' : 'Loyalty Discount'}
                                            </span>
                                            <span>-{formatCurrency(loyaltyDiscount, lang)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between font-bold text-lg text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-700">
                                        <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                                        <span style={{ color: primaryColor }}>{formatCurrency(finalTotal, lang)}</span>
                                    </div>
                                </div>

                                {/* ACTION BUTTONS */}
                                {view === 'cart' ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        <Button
                                            onClick={() => setView('checkout')}
                                            className="w-full h-12 text-base gap-2 text-white shadow-lg"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            <ShoppingCart className="w-5 h-5" />
                                            {isAr ? 'إتمام الطلب' : 'Proceed to Checkout'}
                                        </Button>

                                        {/* WhatsApp Fallback */}
                                        {phone && (
                                            <Button
                                                variant="outline"
                                                onClick={handleWhatsAppFallback}
                                                className="w-full h-10 text-sm gap-2 text-green-600 border-green-200 hover:bg-green-50"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                {isAr ? 'طلب عبر واتساب' : 'Order via WhatsApp'}
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleSubmitOrder}
                                        disabled={createOrder.isPending || !name || !customerPhone || (orderType === 'delivery' && !address)}
                                        className="w-full h-12 text-base gap-2 text-white shadow-lg"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {createOrder.isPending ? (
                                            <span className="animate-spin">⏳</span>
                                        ) : (
                                            <ShoppingCart className="w-5 h-5" />
                                        )}
                                        {isAr ? 'تأكيد الطلب' : 'Submit Order'}
                                        {finalTotal === 0 && (isAr ? '(مجاني)' : '(Free)')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(drawerContent, document.body);
};

export default CartDrawer;
