-- Add menu_item_id to order_items to link sales to the Online/POS Menu
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL;

-- Create recipes table to link menu_items to inventory_items
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT, -- Optional, for display or conversion if needed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(menu_item_id, inventory_item_id)
);

-- Enable RLS for recipes
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Relaxed RLS for recipes (as per user request for other tables)
CREATE POLICY "Authenticated users can view recipes" ON public.recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert recipes" ON public.recipes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update recipes" ON public.recipes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete recipes" ON public.recipes FOR DELETE TO authenticated USING (true);

-- Function to deduct inventory based on menu_item_id (Recipes)
CREATE OR REPLACE FUNCTION public.deduct_inventory_from_recipe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the order item is linked to a menu_item, deduct stock based on recipes
  IF NEW.menu_item_id IS NOT NULL THEN
    INSERT INTO public.inventory_transactions (inventory_item_id, type, quantity, notes, created_by)
    SELECT 
      r.inventory_item_id,
      'out'::transaction_type,
      r.quantity * NEW.quantity,
      'Order Sale #' || COALESCE((SELECT order_number FROM public.orders WHERE id = NEW.order_id), 'Unknown'),
      auth.uid()
    FROM public.recipes r
    WHERE r.menu_item_id = NEW.menu_item_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for inventory deduction using Recipes
DROP TRIGGER IF EXISTS tr_deduct_inventory_recipe ON public.order_items;

CREATE TRIGGER tr_deduct_inventory_recipe
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_inventory_from_recipe();
