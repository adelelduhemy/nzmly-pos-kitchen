-- Disable the stock update trigger since we're using atomic RPC function
-- The adjust_inventory_stock RPC already updates stock AND creates transactions atomically
-- This trigger was causing double updates (stock changed twice per adjustment)

DROP TRIGGER IF EXISTS update_stock_after_transaction ON public.inventory_transactions;
DROP FUNCTION IF EXISTS public.update_stock_on_transaction();

-- Note: The adjust_inventory_stock RPC function handles both:
-- 1. Updating current_stock in inventory_items
-- 2. Creating transaction record in inventory_transactions
-- This ensures atomic updates with no race conditions or duplicates
