import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Trash2, MessageSquare, X, ShoppingBag, Truck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { mockTables } from '@/data/mockData';
import { useOrderStore } from '@/store/orderStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { MenuItem, MenuVariant, MenuModifier } from '@/types';
import PaymentScreen from './PaymentScreen';
import { useMenuItems, MenuItemFromDB } from '@/hooks/useMenuItems';
import CustomerSelector from './CustomerSelector';

interface OrderBuilderProps {
  onBack: () => void;
}

const OrderBuilder: React.FC<OrderBuilderProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const {
    currentOrderType,
    selectedTableId,
    items,
    addItem,
    updateItemQuantity,
    removeItem,
    clearOrder,
    getSubtotal,
    getVAT,
    getTotal,
  } = useOrderStore();

  const { data: menuItemsFromDB = [], isLoading: menuItemsLoading } = useMenuItems();

  // Convert DB menu items to MenuItem format
  const menuItems = menuItemsFromDB.map((dbItem): MenuItem => ({
    id: dbItem.id,
    nameEn: dbItem.name_en,
    nameAr: dbItem.name_ar,
    descriptionEn: dbItem.description_en || '',
    descriptionAr: dbItem.description_ar || '',
    basePrice: Number(dbItem.price),
    categoryId: dbItem.category,
    isActive: dbItem.is_available,
    variants: [],
    modifiers: [],
  }));

  // Get unique categories from menu items
  const categories = Array.from(new Set(menuItems.map(item => item.categoryId)));

  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || '');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Customization state
  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | undefined>();
  const [selectedModifiers, setSelectedModifiers] = useState<MenuModifier[]>([]);
  const [itemNotes, setItemNotes] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  const selectedTable = mockTables.find((t) => t.id === selectedTableId);
  const filteredItems = menuItems.filter((item) => item.categoryId === selectedCategory && item.isActive);

  const openCustomization = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedVariant(item.variants[0]);
    setSelectedModifiers([]);
    setItemNotes('');
    setItemQuantity(1);
    setCustomizationOpen(true);
  };

  const handleAddToOrder = () => {
    if (selectedItem) {
      addItem(selectedItem, itemQuantity, selectedVariant, selectedModifiers, itemNotes || undefined);
      setCustomizationOpen(false);
      setSelectedItem(null);
    }
  };

  const toggleModifier = (modifier: MenuModifier) => {
    setSelectedModifiers((prev) =>
      prev.some((m) => m.id === modifier.id)
        ? prev.filter((m) => m.id !== modifier.id)
        : [...prev, modifier]
    );
  };

  const calculateCustomPrice = (): number => {
    if (!selectedItem) return 0;
    let price = selectedItem.basePrice;
    if (selectedVariant) price += selectedVariant.priceAdjustment;
    price += selectedModifiers.reduce((sum, m) => sum + m.price, 0);
    return price * itemQuantity;
  };

  if (showPayment) {
    return <PaymentScreen onBack={() => setShowPayment(false)} />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Left Side - Menu */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className={cn('w-5 h-5', isRTL && 'rotate-180')} />
          </Button>
          <div className="flex gap-2">
            <Button
              variant={currentOrderType === 'takeaway' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                useOrderStore.getState().setOrderType('takeaway');
                onBack(); // Go back to table selection
              }}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              {selectedTable ? `${t('kds.table')} ${selectedTable.number}` : t('pos.takeaway')}
            </Button>
            <Button
              variant={currentOrderType === 'delivery' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                useOrderStore.getState().setOrderType('delivery');
                useOrderStore.getState().setSelectedTable(null);
              }}
              className="gap-2"
            >
              <Truck className="w-4 h-4" />
              {t('pos.delivery')}
            </Button>

          </div>
        </div>

        {/* Categories */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
                <Badge variant="secondary" className="ml-2">
                  {menuItems.filter((i) => i.categoryId === category).length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pr-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className="menu-item-card h-full"
                    onClick={() => openCustomization(item)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <span className="text-3xl">🍽️</span>
                      </div>
                      <h3 className="font-semibold line-clamp-1">
                        {isRTL ? item.nameAr : item.nameEn}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {isRTL ? item.descriptionAr : item.descriptionEn}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-primary">
                          {formatCurrency(item.basePrice, i18n.language)}
                        </span>
                        {(item.variants.length > 0 || item.modifiers.length > 0) && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.variants.length + item.modifiers.length}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Right Side - Order Sidebar */}
      <Card className="w-full lg:w-96 flex flex-col order-sidebar">
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          {/* Customer Selector */}
          <CustomerSelector
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={setSelectedCustomerId}
          />

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{t('pos.currentOrder')}</h3>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearOrder} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-1" />
                {t('pos.clearOrder')}
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>{t('pos.addItems')}</p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="space-y-3">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-muted/50 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {isRTL ? item.menuItem.nameAr : item.menuItem.nameEn}
                            </h4>
                            {item.selectedVariant && (
                              <p className="text-sm text-muted-foreground">
                                {isRTL ? item.selectedVariant.nameAr : item.selectedVariant.nameEn}
                              </p>
                            )}
                            {item.selectedModifiers.length > 0 && (
                              <p className="text-sm text-muted-foreground">
                                +{item.selectedModifiers.map((m) => (isRTL ? m.nameAr : m.nameEn)).join(', ')}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {item.notes}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(item.totalPrice, i18n.language)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              {/* Order Summary */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('common.subtotal')}</span>
                  <span>{formatCurrency(getSubtotal(), i18n.language)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('common.vat')} (15%)</span>
                  <span>{formatCurrency(getVAT(), i18n.language)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>{t('common.total')}</span>
                  <span className="text-primary">{formatCurrency(getTotal(), i18n.language)}</span>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            <Button
              className="w-full h-12"
              disabled={items.length === 0}
              onClick={() => setShowPayment(true)}
            >
              {t('pos.sendToKitchen')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Item Customization Dialog */}
      <Dialog open={customizationOpen} onOpenChange={setCustomizationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pos.itemCustomization')}</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Item Info */}
              <div className="text-center">
                <div className="w-20 h-20 bg-muted rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <span className="text-4xl">🍽️</span>
                </div>
                <h3 className="font-bold text-lg">
                  {isRTL ? selectedItem.nameAr : selectedItem.nameEn}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? selectedItem.descriptionAr : selectedItem.descriptionEn}
                </p>
              </div>

              {/* Variants */}
              {selectedItem.variants.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">{t('pos.selectSize')}</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedItem.variants.map((variant) => (
                      <Button
                        key={variant.id}
                        variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedVariant(variant)}
                      >
                        {isRTL ? variant.nameAr : variant.nameEn}
                        {variant.priceAdjustment > 0 && (
                          <span className="ml-1 opacity-75">
                            (+{formatCurrency(variant.priceAdjustment, i18n.language)})
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Modifiers */}
              {selectedItem.modifiers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">{t('pos.addOns')}</h4>
                  <div className="space-y-2">
                    {selectedItem.modifiers.map((modifier) => (
                      <label
                        key={modifier.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedModifiers.some((m) => m.id === modifier.id)}
                            onCheckedChange={() => toggleModifier(modifier)}
                          />
                          <span>{isRTL ? modifier.nameAr : modifier.nameEn}</span>
                        </div>
                        <span className="font-medium">
                          +{formatCurrency(modifier.price, i18n.language)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <h4 className="font-medium mb-3">{t('pos.specialNotes')}</h4>
                <Input
                  placeholder={t('common.notes')}
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between">
                <span className="font-medium">{t('common.quantity')}</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold w-8 text-center">{itemQuantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Add Button */}
              <Button className="w-full h-12" onClick={handleAddToOrder}>
                {t('pos.addToOrder')} - {formatCurrency(calculateCustomPrice(), i18n.language)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderBuilder;
