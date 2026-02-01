-- ================================
-- 1. جدول المصروفات اليومية
-- ================================
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- rent, utilities, salaries, supplies, other
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policies for expenses
CREATE POLICY "Owners and managers can view expenses"
  ON public.expenses FOR SELECT
  USING (is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can update expenses"
  ON public.expenses FOR UPDATE
  USING (is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can delete expenses"
  ON public.expenses FOR DELETE
  USING (is_owner_or_manager(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ================================
-- 2. جدول إقفال الشيفت/اليومية
-- ================================
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  opening_cash NUMERIC NOT NULL DEFAULT 0,
  closing_cash NUMERIC,
  total_sales NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  cash_sales NUMERIC DEFAULT 0,
  card_sales NUMERIC DEFAULT 0,
  online_sales NUMERIC DEFAULT 0,
  discounts_total NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open, closed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Policies for shifts
CREATE POLICY "Users can view their own shifts"
  ON public.shifts FOR SELECT
  USING (user_id = auth.uid() OR is_owner_or_manager(auth.uid()));

CREATE POLICY "Cashiers can insert shifts"
  ON public.shifts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own shifts"
  ON public.shifts FOR UPDATE
  USING (user_id = auth.uid() OR is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners can delete shifts"
  ON public.shifts FOR DELETE
  USING (is_owner_or_manager(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ================================
-- 3. جدول الطلبات للتقارير
-- ================================
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'dine-in', -- dine-in, takeaway, delivery
  table_number TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  vat NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT, -- cash, card, online
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, preparing, ready, served, paid, cancelled
  shift_id UUID REFERENCES public.shifts(id),
  cashier_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies for orders
CREATE POLICY "Authenticated users can view orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Cashiers can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Cashiers can update orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and managers can delete orders"
  ON public.orders FOR DELETE
  USING (is_owner_or_manager(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ================================
-- 4. جدول عناصر الطلب
-- ================================
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  dish_id UUID REFERENCES public.dishes(id),
  dish_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies for order_items
CREATE POLICY "Authenticated users can view order items"
  ON public.order_items FOR SELECT
  USING (true);

CREATE POLICY "Users can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update order items"
  ON public.order_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can delete order items"
  ON public.order_items FOR DELETE
  USING (is_owner_or_manager(auth.uid()));

-- ================================
-- 5. Function لخصم المخزون التلقائي عند البيع
-- ================================
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_order_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- خصم المواد الخام من المخزون بناءً على وصفة الطبق
  INSERT INTO public.inventory_transactions (inventory_item_id, type, quantity, notes, created_by)
  SELECT 
    di.inventory_item_id,
    'out'::transaction_type,
    di.quantity_consumed * NEW.quantity,
    'خصم تلقائي - طلب #' || (SELECT order_number FROM public.orders WHERE id = NEW.order_id),
    auth.uid()
  FROM public.dish_ingredients di
  WHERE di.dish_id = NEW.dish_id;
  
  RETURN NEW;
END;
$$;

-- Trigger لخصم المخزون عند إضافة عنصر للطلب
CREATE TRIGGER deduct_inventory_trigger
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  WHEN (NEW.dish_id IS NOT NULL)
  EXECUTE FUNCTION public.deduct_inventory_on_order_item();

-- ================================
-- 6. أنواع المصروفات
-- ================================
CREATE TYPE public.expense_category AS ENUM (
  'rent',
  'utilities', 
  'salaries',
  'supplies',
  'maintenance',
  'marketing',
  'other'
);