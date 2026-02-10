-- Migration: Add Unique Constraint and Performance Indexes
-- Purpose: Address audit findings for Order Number collisions and query performance.
-- Date: 2026-02-09

-- ============================================================================
-- 1. Unique Constraint on Order Number
-- ============================================================================
-- Ensures that even if the RPC retry loop has a race condition, the DB will reject duplicates.

ALTER TABLE public.orders
ADD CONSTRAINT uq_orders_order_number UNIQUE (order_number);

-- ============================================================================
-- 2. Unique Constraint on Idempotency Key (if not already present)
-- ============================================================================
-- Prevents duplicate order submissions from retries.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_orders_idempotency_key'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT uq_orders_idempotency_key UNIQUE (idempotency_key);
    END IF;
END $$;

-- ============================================================================
-- 3. Performance Indexes for Hot Query Paths
-- ============================================================================

-- Orders: Fetching recent orders for KDS, Orders page
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders (created_at DESC);

-- Orders: Filtering by status (pending, preparing, ready)
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- Order Items: JOINing items to orders
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- Inventory Transactions: Fetching transaction history for an item
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_created 
ON public.inventory_transactions (inventory_item_id, created_at DESC);

-- Menu Items: Filtering by category
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items (category_id);

-- ============================================================================
-- Migration Complete
-- ============================================================================
SELECT 'Unique constraints and performance indexes applied successfully' as status;
