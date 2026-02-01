-- Relax RLS policies for menu_categories
DROP POLICY IF EXISTS "Owners and managers can insert menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Owners and managers can update menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Owners and managers can delete menu categories" ON public.menu_categories;

CREATE POLICY "Authenticated users can insert menu categories" 
ON public.menu_categories FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update menu categories" 
ON public.menu_categories FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete menu categories" 
ON public.menu_categories FOR DELETE 
TO authenticated 
USING (true);

-- Relax RLS policies for menu_items
DROP POLICY IF EXISTS "Owners and managers can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Owners and managers can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Owners and managers can delete menu items" ON public.menu_items;

CREATE POLICY "Authenticated users can insert menu items" 
ON public.menu_items FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update menu items" 
ON public.menu_items FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete menu items" 
ON public.menu_items FOR DELETE 
TO authenticated 
USING (true);

-- Relax RLS policies for restaurant_settings
DROP POLICY IF EXISTS "Owners can insert restaurant settings" ON public.restaurant_settings;
DROP POLICY IF EXISTS "Owners can update restaurant settings" ON public.restaurant_settings;

CREATE POLICY "Authenticated users can insert restaurant settings" 
ON public.restaurant_settings FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update restaurant settings" 
ON public.restaurant_settings FOR UPDATE 
TO authenticated 
USING (true);
