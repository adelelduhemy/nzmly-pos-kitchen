export type UserRole = 'owner' | 'manager' | 'cashier' | 'kitchen' | 'inventory';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface Table {
  id: string;
  number: string;
  capacity: number;
  section: 'indoor' | 'outdoor';
  status: TableStatus;
}

export interface MenuCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  order: number;
  isActive: boolean;
}

export interface MenuVariant {
  id: string;
  nameEn: string;
  nameAr: string;
  priceAdjustment: number;
}

export interface MenuModifier {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  basePrice: number;
  image?: string;
  isActive: boolean;
  variants: MenuVariant[];
  modifiers: MenuModifier[];
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedVariant?: MenuVariant;
  selectedModifiers: MenuModifier[];
  notes?: string;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  tableId?: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type TicketStatus = 'new' | 'preparing' | 'ready';

export interface KDSTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  type: OrderType;
  items: { name: string; quantity: number; notes?: string }[];
  status: TicketStatus;
  createdAt: Date;
  startedAt?: Date;
  readyAt?: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  warehouseId: string;
}

export interface DailySales {
  hour: string;
  sales: number;
}

export interface TopSellingItem {
  name: string;
  quantity: number;
  revenue: number;
}
