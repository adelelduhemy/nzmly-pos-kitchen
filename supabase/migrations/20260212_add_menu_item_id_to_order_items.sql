-- Add menu_item_id to order_items to link sales to specific menu entries
-- This is necessary for the create_online_order RPC and general reporting

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'menu_item_id'
  ) THEN
    ALTER TABLE public.order_items 
    ADD COLUMN menu_item_id UUID REFERENCES public.menu_items(id);
  END IF;
END $$;
