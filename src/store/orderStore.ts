import { create } from 'zustand';
import { OrderItem, MenuItem, MenuVariant, MenuModifier, OrderType } from '@/types';

interface OrderStore {
  currentOrderType: OrderType;
  selectedTableId: string | null;
  items: OrderItem[];
  setOrderType: (type: OrderType) => void;
  setSelectedTable: (tableId: string | null) => void;
  addItem: (
    menuItem: MenuItem,
    quantity: number,
    variant?: MenuVariant,
    modifiers?: MenuModifier[],
    notes?: string
  ) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearOrder: () => void;
  getSubtotal: () => number;
  getVAT: () => number;
  getTotal: () => number;
}

const calculateItemPrice = (
  basePrice: number,
  variant?: MenuVariant,
  modifiers?: MenuModifier[]
): number => {
  let price = basePrice;
  if (variant) price += variant.priceAdjustment;
  if (modifiers) price += modifiers.reduce((sum, m) => sum + m.price, 0);
  return price;
};

export const useOrderStore = create<OrderStore>((set, get) => ({
  currentOrderType: 'takeaway',
  selectedTableId: null,
  items: [],

  setOrderType: (type) => set({ currentOrderType: type }),

  setSelectedTable: (tableId) => set({ selectedTableId: tableId }),

  addItem: (menuItem, quantity, variant, modifiers = [], notes) => {
    const unitPrice = calculateItemPrice(menuItem.basePrice, variant, modifiers);
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      menuItem,
      quantity,
      selectedVariant: variant,
      selectedModifiers: modifiers,
      notes,
      unitPrice,
      totalPrice: unitPrice * quantity,
    };
    set((state) => ({ items: [...state.items, newItem] }));
  },

  updateItemQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
          : item
      ),
    }));
  },

  removeItem: (itemId) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== itemId) }));
  },

  clearOrder: () => set({ items: [], selectedTableId: null }),

  getSubtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),

  getVAT: () => get().getSubtotal() * 0.15,

  getTotal: () => get().getSubtotal() + get().getVAT(),
}));
