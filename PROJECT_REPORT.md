# NZMLY POS Kitchen - Comprehensive Project Report

## Executive Summary

NZMLY POS Kitchen is a full-featured **Restaurant Management System & Point of Sale** application built with React, TypeScript, and Supabase. It provides comprehensive tools for managing restaurants including POS, inventory, CRM, kitchen display systems, and financial management with role-based access control.

---

## 1. Tech Stack & Architecture

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State Management** | Zustand + TanStack Query |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) |
| **Animation** | Framer Motion |
| **I18n** | i18next (Arabic/English) |
| **Testing** | Vitest |

---

## 2. Core Features (14 Modules)

### A. Point of Sale (POS)
- Table selection (indoor/outdoor sections)
- Order types: dine-in, takeaway, delivery
- Order builder with menu items, variants, modifiers
- Real-time order creation with atomic transactions
- Idempotency protection against duplicate orders

### B. Orders Management
- Order history with search & filters
- Status tracking: pending → preparing → ready → served → paid
- Payment status tracking (paid/unpaid)
- Date range filtering (today, yesterday, week, month)
- Order details with print functionality

### C. Kitchen Display System (KDS)
- Real-time order board with 3 columns (Pending/Preparing/Ready)
- Live updates via Supabase subscriptions
- Order status progression workflow
- Optimized for kitchen staff workflow

### D. Inventory Management
- Multi-warehouse support (Raw Materials, WIP, Finished Goods)
- Stock tracking with minimum thresholds
- Stock adjustment (in/out transactions)
- Low stock alerts
- Inventory value calculation
- Transaction history

### E. Dishes & Recipes
- Recipe linking: menu items → inventory items
- Automatic inventory deduction on order
- BOM (Bill of Materials) management
- Recipe usage tracking

### F. Menu Management
- Online menu with public QR code access
- Menu categories with icons
- Menu items with variants & modifiers
- Availability toggles
- Featured items

### G. Table Management
- Indoor/outdoor sections
- Capacity management
- Status: available, occupied, reserved, cleaning
- Table linking to active orders

### H. CRM & Loyalty
- Customer database with phone/address
- Loyalty points (1 point per 10 SAR)
- Coupon system (percentage/fixed discounts)
- Customer purchase history
- SMS campaign management

### I. Suppliers & Purchases
- Supplier database with contact info
- Purchase orders (draft → sent → received)
- PO items with quantities and prices
- Supplier purchase totals

### J. Financial Management
- Expense tracking
- Shift management
- Financial reports
- Payment method tracking

### K. Reports & Analytics
- Daily sales charts
- Top-selling items
- Order statistics
- Inventory reports
- Low stock alerts panel

### L. User Management
- 5 role types: owner, manager, cashier, kitchen, inventory
- Dynamic permission system (role_permissions table)
- User profile management
- Role assignment by managers/owners

### M. Settings
- Restaurant branding (name, logo, colors)
- QR menu customization
- Welcome messages
- Social media links

---

## 3. Database Schema (Supabase)

### Core Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User info linked to auth.users |
| `user_roles` | Role assignments per user |
| `role_permissions` | Dynamic permission matrix |
| `warehouses` | Storage locations |
| `inventory_items` | Stock items with quantities |
| `inventory_transactions` | Stock in/out records |
| `recipes` | Menu item → inventory links |
| `dishes` | Menu dish definitions |
| `menu_items` | Online menu items |
| `menu_categories` | Menu organization |
| `orders` | Order headers |
| `order_items` | Order line items |
| `restaurant_tables` | Physical tables |
| `customers` | CRM customer data |
| `loyalty_transactions` | Points tracking |
| `coupons` | Discount codes |
| `suppliers` | Vendor database |
| `purchase_orders` | Purchase order headers |
| `purchase_order_items` | PO line items |
| `restaurant_settings` | System configuration |

### Database Features
- **RLS (Row Level Security)** on all tables
- **Triggers** for auto-updating timestamps, stock levels, customer stats
- **Functions** for role checking (is_owner_or_manager, can_manage_inventory)
- **RPC Function** `create_order_atomic()` for transaction-safe order creation

---

## 4. Authentication & RBAC

### Role Hierarchy
| Role | Access Level |
|------|--------------|
| **Owner** | Full access to all modules |
| **Manager** | Most modules except settings/finance view restrictions |
| **Cashier** | POS, Orders, Tables, Dashboard |
| **Kitchen** | KDS only |
| **Inventory** | Inventory, Suppliers |

### Permission System
Permissions stored in `role_permissions` with:
- `resource`: module identifier (pos, orders, inventory, etc.)
- `can_view`, `can_edit`, `can_delete`: boolean flags
- Pre-seeded with sensible defaults per role

### Frontend Auth
- `useAuth.ts` hook manages authentication state
- `AuthContext` provides auth data to app
- `ProtectedRoute` component guards routes by permission
- Automatic session persistence with Supabase

---

## 5. Key Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAuth()` | Authentication state, roles, permissions |
| `useOrders()` | Fetch active orders + realtime subscription |
| `useOrderHistory()` | Paginated order history with filters |
| `useUpdateOrderStatus()` | Mutation for status changes |
| `useTables()` | Table management with realtime updates |
| `useSalesAnalytics()` | Sales data for charts |
| `useAdjustStock()` | Inventory adjustment mutations |
| `useCreateOrder()` | Order creation with error handling |

---

## 6. State Management

### Zustand Stores
- `orderStore.ts`: Current POS order (items, type, table)

### TanStack Query
- Server state caching
- Real-time subscriptions via `useEffect`
- Optimistic updates for mutations

---

## 7. Project Structure

```
src/
├── pages/           # 14 route pages (POS, Orders, KDS, etc.)
├── components/
│   ├── ui/         # 49 shadcn/ui components
│   ├── pos/        # Order builder, table selection
│   ├── kds/        # Kitchen display cards
│   ├── inventory/  # Stock dialogs, history
│   ├── dashboard/  # Charts, stats, alerts
│   └── layout/     # App shell, navigation
├── hooks/          # 14 custom hooks
├── store/          # Zustand stores
├── contexts/       # Auth context
├── types/          # TypeScript definitions
├── integrations/   # Supabase client & types
├── i18n/           # Translation files
└── utils/          # Helper functions

supabase/migrations/  # 22 SQL migration files
```

---

## 8. Notable Technical Decisions

1. **Atomic Order Creation**: RPC function prevents partial order creation
2. **Idempotency Keys**: Prevents duplicate orders on retries
3. **Recipe System**: Automatic inventory deduction based on dish recipes
4. **Realtime Updates**: Supabase subscriptions for live KDS and orders
5. **Bilingual Support**: Full Arabic/English i18n
6. **RLS Security**: Row-level security on all database tables
7. **Role-based Dashboard**: Navigation cards filtered by user permissions

---

## 9. Migration Files Summary

| Migration | Purpose |
|-----------|---------|
| `20260127185900_*` | Core tables (warehouses, inventory, roles, profiles) |
| `20260127193056_*` | Orders & kitchen tickets system |
| `20260128164413_*` | Dishes & dishes_ingredients tables |
| `20260128165206_*` | Suppliers, purchase orders, CRM, loyalty, menu |
| `20260201161706_*` | Recipe system linking menu to inventory |
| `20260203_create_role_permissions.sql` | Dynamic RBAC permissions |
| `20260203_create_order_rpc.sql` | Atomic order creation function |
| `20260203_create_restaurant_tables.sql` | Table management |

---

## 10. Summary

NZMLY POS Kitchen is a production-ready, enterprise-grade restaurant management system with:
- ✅ Complete POS workflow (table → order → kitchen → payment)
- ✅ Multi-role access control with dynamic permissions
- ✅ Inventory with recipe-based deduction
- ✅ CRM with loyalty points and coupons
- ✅ Real-time kitchen display
- ✅ Supplier & purchase order management
- ✅ Bilingual UI (Arabic/English)
- ✅ Responsive design with modern UI
- ✅ Secure RLS policies on all data

**Total**: ~14 pages, 14 hooks, 49 UI components, 22 database tables, 5 user roles
