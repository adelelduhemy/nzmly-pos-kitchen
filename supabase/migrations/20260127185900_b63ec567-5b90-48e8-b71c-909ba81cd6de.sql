-- Create enum for warehouse types
CREATE TYPE public.warehouse_type AS ENUM ('raw_materials', 'work_in_progress', 'finished_goods');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'cashier', 'kitchen', 'inventory');

-- Create enum for transaction types
CREATE TYPE public.transaction_type AS ENUM ('in', 'out');

-- Create warehouses table
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  type warehouse_type NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  sku TEXT UNIQUE,
  unit TEXT NOT NULL DEFAULT 'kg',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  minimum_stock NUMERIC NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create inventory_transactions table
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  quantity NUMERIC NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, warehouse_id)
);

-- Create profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to check if user is owner or manager
CREATE OR REPLACE FUNCTION public.is_owner_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner', 'manager')
  )
$$;

-- Create helper function to check if user can manage inventory
CREATE OR REPLACE FUNCTION public.can_manage_inventory(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner', 'manager', 'inventory')
  )
$$;

-- Warehouses policies
CREATE POLICY "Authenticated users can view warehouses"
  ON public.warehouses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and managers can insert warehouses"
  ON public.warehouses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can update warehouses"
  ON public.warehouses FOR UPDATE
  TO authenticated
  USING (public.is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can delete warehouses"
  ON public.warehouses FOR DELETE
  TO authenticated
  USING (public.is_owner_or_manager(auth.uid()));

-- Inventory items policies
CREATE POLICY "Authenticated users can view inventory items"
  ON public.inventory_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners and managers can insert inventory items"
  ON public.inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can update inventory items"
  ON public.inventory_items FOR UPDATE
  TO authenticated
  USING (public.is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can delete inventory items"
  ON public.inventory_items FOR DELETE
  TO authenticated
  USING (public.is_owner_or_manager(auth.uid()));

-- Inventory transactions policies
CREATE POLICY "Authenticated users can view transactions"
  ON public.inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Inventory managers can insert transactions"
  ON public.inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_inventory(auth.uid()));

CREATE POLICY "Owners and managers can update transactions"
  ON public.inventory_transactions FOR UPDATE
  TO authenticated
  USING (public.is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can delete transactions"
  ON public.inventory_transactions FOR DELETE
  TO authenticated
  USING (public.is_owner_or_manager(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_owner_or_manager(auth.uid()) 
    AND user_id != auth.uid()
  );

CREATE POLICY "Owners and managers can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.is_owner_or_manager(auth.uid()));

CREATE POLICY "Owners and managers can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_owner_or_manager(auth.uid()));

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to update stock on transaction
CREATE OR REPLACE FUNCTION public.update_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE public.inventory_items
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.inventory_item_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE public.inventory_items
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.inventory_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_stock_after_transaction
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_transaction();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default warehouses
INSERT INTO public.warehouses (name_en, name_ar, type, description) VALUES
  ('Raw Materials', 'مواد خام', 'raw_materials', 'مستودع المواد الخام الأولية'),
  ('Work in Progress', 'قيد الإنشاء', 'work_in_progress', 'مستودع المنتجات قيد التصنيع'),
  ('Finished Goods', 'تام', 'finished_goods', 'مستودع المنتجات الجاهزة');