-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  payment_terms TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_purchases NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  vat NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  expected_date DATE,
  received_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  received_quantity NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu_items table for online menu
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dish_id UUID REFERENCES public.dishes(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu_categories table
CREATE TABLE public.menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create restaurant_settings table for QR menu customization
CREATE TABLE public.restaurant_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_name_ar TEXT NOT NULL DEFAULT 'مطعمي',
  restaurant_name_en TEXT NOT NULL DEFAULT 'My Restaurant',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563EB',
  menu_slug TEXT UNIQUE,
  welcome_message_ar TEXT,
  welcome_message_en TEXT,
  phone TEXT,
  address TEXT,
  instagram TEXT,
  twitter TEXT,
  is_menu_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Suppliers policies
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Owners and managers can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (is_owner_or_manager(auth.uid()));
CREATE POLICY "Owners and managers can update suppliers" ON public.suppliers FOR UPDATE USING (is_owner_or_manager(auth.uid()));
CREATE POLICY "Owners and managers can delete suppliers" ON public.suppliers FOR DELETE USING (is_owner_or_manager(auth.uid()));

-- Purchase orders policies
CREATE POLICY "Authenticated users can view purchase orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Inventory managers can insert purchase orders" ON public.purchase_orders FOR INSERT WITH CHECK (can_manage_inventory(auth.uid()));
CREATE POLICY "Inventory managers can update purchase orders" ON public.purchase_orders FOR UPDATE USING (can_manage_inventory(auth.uid()));
CREATE POLICY "Owners can delete purchase orders" ON public.purchase_orders FOR DELETE USING (is_owner_or_manager(auth.uid()));

-- Purchase order items policies
CREATE POLICY "Authenticated users can view purchase order items" ON public.purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Inventory managers can insert purchase order items" ON public.purchase_order_items FOR INSERT WITH CHECK (can_manage_inventory(auth.uid()));
CREATE POLICY "Inventory managers can update purchase order items" ON public.purchase_order_items FOR UPDATE USING (can_manage_inventory(auth.uid()));

-- Menu items policies (public for online menu)
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Owners and managers can insert menu items" ON public.menu_items FOR INSERT WITH CHECK (is_owner_or_manager(auth.uid()));
CREATE POLICY "Owners and managers can update menu items" ON public.menu_items FOR UPDATE USING (is_owner_or_manager(auth.uid()));
CREATE POLICY "Owners and managers can delete menu items" ON public.menu_items FOR DELETE USING (is_owner_or_manager(auth.uid()));

-- Menu categories policies (public for online menu)
CREATE POLICY "Anyone can view menu categories" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Owners and managers can insert menu categories" ON public.menu_categories FOR INSERT WITH CHECK (is_owner_or_manager(auth.uid()));
CREATE POLICY "Owners and managers can update menu categories" ON public.menu_categories FOR UPDATE USING (is_owner_or_manager(auth.uid()));
CREATE POLICY "Owners and managers can delete menu categories" ON public.menu_categories FOR DELETE USING (is_owner_or_manager(auth.uid()));

-- Restaurant settings policies
CREATE POLICY "Anyone can view restaurant settings" ON public.restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Owners can insert restaurant settings" ON public.restaurant_settings FOR INSERT WITH CHECK (is_owner_or_manager(auth.uid()));
CREATE POLICY "Owners can update restaurant settings" ON public.restaurant_settings FOR UPDATE USING (is_owner_or_manager(auth.uid()));

-- Triggers
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_settings_updated_at BEFORE UPDATE ON public.restaurant_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default restaurant settings
INSERT INTO public.restaurant_settings (restaurant_name_ar, restaurant_name_en, menu_slug)
VALUES ('مطعمي', 'My Restaurant', 'my-restaurant');