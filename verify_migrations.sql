-- Verify migrations were applied successfully
-- Run these checks in SQL Editor

-- 1. Check if new columns exist in orders table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('idempotency_key', 'version', 'location_id')
ORDER BY column_name;

-- 2. Check if unique constraints exist
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'orders' 
  AND constraint_type = 'UNIQUE';

-- 3. Check if indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('orders', 'order_items', 'inventory_transactions')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 4. Check if RPC function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'create_order_atomic';

-- 5. Test idempotency (safe to run multiple times - should not create duplicates)
-- First run will create order, second run returns existing order
-- SELECT create_order_atomic(
--   'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
--   'dine-in',
--   'T1',
--   100, 15, 0, 115,
--   'cash', 'unpaid', 'Test order',
--   '[{"dishName":"Test Item","quantity":1,"unitPrice":100,"totalPrice":100}]'::jsonb
-- );
