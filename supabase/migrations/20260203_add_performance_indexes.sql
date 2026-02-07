-- Add critical performance indexes for Reports, Order History and KDS

-- 1. Accelerate "Recent Orders" and "Daily Sales" queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON public.orders(created_at DESC);

-- 2. Accelerate "Active Orders" (KDS) queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON public.orders(status, created_at DESC);

-- 3. Accelerate Order Items lookups (Joins)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON public.order_items(order_id);

-- 4. Accelerate Inventory History queries
CREATE INDEX IF NOT EXISTS idx_inventory_trans_item_date 
ON public.inventory_transactions(inventory_item_id, created_at DESC);

-- 5. Accelerate Order Search by Order Number
-- (Covered by UNIQUE constraint, but good to be explicit if that wasn't there)
-- CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
