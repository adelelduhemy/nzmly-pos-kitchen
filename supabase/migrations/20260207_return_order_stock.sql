-- Migration: Add stock return function for cancelled orders
-- This ensures inventory is returned when an order is cancelled

-- Function to return inventory based on order recipes when order is cancelled
CREATE OR REPLACE FUNCTION public.return_order_stock(order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    order_record RECORD;
    item_record RECORD;
BEGIN
    -- Get order details
    SELECT id, status INTO order_record FROM public.orders WHERE id = order_id;
    
    IF order_record IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- Process each order item that has a linked menu_item_id
    FOR item_record IN 
        SELECT oi.id, oi.menu_item_id, oi.quantity
        FROM public.order_items oi
        WHERE oi.order_id = order_id AND oi.menu_item_id IS NOT NULL
    LOOP
        -- Return stock for each ingredient in the recipe
        INSERT INTO public.inventory_transactions (inventory_item_id, type, quantity, notes, created_by)
        SELECT 
            r.inventory_item_id,
            'in'::transaction_type, -- 'in' for stock return
            r.quantity * item_record.quantity,
            'Order Cancelled #' || order_id || ' (Item: ' || item_record.menu_item_id || ')',
            auth.uid()
        FROM public.recipes r
        WHERE r.menu_item_id = item_record.menu_item_id;
    END LOOP;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.return_order_stock IS 'Returns recipe ingredients to inventory when an order is cancelled. Call this before updating order status to cancelled.';

