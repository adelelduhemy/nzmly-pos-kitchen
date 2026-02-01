-- Relax RLS policies for inventory_items to allow all authenticated users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Owners and managers can insert inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Owners and managers can update inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Owners and managers can delete inventory items" ON public.inventory_items;

-- Create relaxed policies for authenticated users
CREATE POLICY "Authenticated users can insert inventory items"
  ON public.inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory items"
  ON public.inventory_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete inventory items"
  ON public.inventory_items FOR DELETE
  TO authenticated
  USING (true);
