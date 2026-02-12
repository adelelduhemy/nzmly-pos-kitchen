-- ============================================================================
-- H-03 Fix: Table Identity Mismatch
-- Problem: POS sends table UUID as `table_number` (text). Table release logic
--          is split between client and DB, using inconsistent identifiers.
-- Fix: Add proper `table_id` UUID column, update RPCs to use it, and
--      auto-free tables on completion/cancellation inside the DB.
-- Date: 2026-02-11
-- ============================================================================

-- 1. Add table_id UUID column to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;

-- 2. Backfill: where table_number is a valid UUID matching restaurant_tables.id
UPDATE public.orders o
SET table_id = rt.id
FROM public.restaurant_tables rt
WHERE o.table_number IS NOT NULL
  AND o.table_id IS NULL
  AND o.table_number::text = rt.id::text;

-- 3. Recreate create_order_atomic with table_id support
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_idempotency_key UUID,
  p_order_type TEXT,
  p_table_number TEXT,
  p_subtotal NUMERIC,
  p_vat NUMERIC,
  p_discount NUMERIC,
  p_total NUMERIC,
  p_payment_method TEXT,
  p_payment_status TEXT,
  p_notes TEXT,
  p_items JSONB,
  p_customer_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_existing_order JSONB;
  v_table_id UUID;
  v_shift_id UUID;
BEGIN
  -- 1. Check idempotency
  SELECT json_build_object(
    'id', id,
    'order_number', order_number,
    'status', status,
    'is_duplicate', true
  ) INTO v_existing_order
  FROM orders
  WHERE idempotency_key = p_idempotency_key;

  IF v_existing_order IS NOT NULL THEN
    RETURN v_existing_order;
  END IF;

  -- 2. Get user context
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 3. Resolve table_id from p_table_number (which is actually a UUID from the frontend)
  IF p_table_number IS NOT NULL AND p_table_number != '' THEN
    BEGIN
      v_table_id := p_table_number::UUID;
      -- Verify the table exists
      IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE id = v_table_id) THEN
        v_table_id := NULL;
      END IF;
    EXCEPTION WHEN invalid_text_representation THEN
      -- Not a valid UUID, store as text only
      v_table_id := NULL;
    END;
  END IF;

  -- 4. Find current open shift for this user (H-05 fix: link orders to shifts)
  SELECT id INTO v_shift_id
  FROM public.shifts
  WHERE user_id = v_user_id AND status = 'open'
  ORDER BY started_at DESC
  LIMIT 1;

  -- 5. Generate Order Number (YYMMDD-XXXX)
  v_order_number := to_char(now(), 'YYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));

  -- 6. Insert Order
  INSERT INTO public.orders (
    order_number,
    cashier_id,
    order_type,
    table_number,
    table_id,
    shift_id,
    subtotal,
    vat,
    discount,
    total,
    payment_method,
    payment_status,
    status,
    notes,
    idempotency_key,
    customer_id,
    created_at,
    updated_at
  ) VALUES (
    v_order_number,
    v_user_id,
    p_order_type,
    p_table_number,
    v_table_id,
    v_shift_id,
    p_subtotal,
    p_vat,
    p_discount,
    p_total,
    p_payment_method,
    p_payment_status,
    'pending',
    p_notes,
    p_idempotency_key,
    p_customer_id,
    now(),
    now()
  ) RETURNING id INTO v_order_id;

  -- 7. Insert Order Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      dish_name,
      quantity,
      unit_price,
      total_price,
      notes
    ) VALUES (
      v_order_id,
      (v_item->>'menuItemId')::UUID,
      v_item->>'dishName',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unitPrice')::NUMERIC,
      (v_item->>'totalPrice')::NUMERIC,
      v_item->>'notes'
    );
  END LOOP;

  -- 8. Mark table as occupied if table_id is set
  IF v_table_id IS NOT NULL THEN
    UPDATE public.restaurant_tables
    SET status = 'occupied', current_order_id = v_order_id
    WHERE id = v_table_id;
  END IF;

  -- 9. Return new order info
  RETURN json_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'status', 'pending',
    'is_duplicate', false
  );
END;
$$;


-- 4. Update update_order_status to auto-free tables on completed/cancelled
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,
    p_new_status TEXT,
    p_expected_version INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_version INT;
    v_current_status TEXT;
    v_stock_returned_at TIMESTAMPTZ;
    v_table_id UUID;
    v_updated_order JSONB;
    v_caller_role TEXT;
    item_record RECORD;
BEGIN
    -- 0. Role Guard
    SELECT role INTO v_caller_role
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF v_caller_role IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: no role assigned');
    END IF;

    -- 1. Lock the row and get current state
    SELECT version, status, stock_returned_at, table_id
    INTO v_current_version, v_current_status, v_stock_returned_at, v_table_id
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_current_version IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- 2. Optimistic Lock Check
    IF v_current_version != p_expected_version THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Conflict: Order was modified by another user. Please refresh.',
            'current_version', v_current_version,
            'current_status', v_current_status
        );
    END IF;

    -- 3. Status Transition Validation
    IF NOT (
        (v_current_status = 'pending' AND p_new_status IN ('preparing', 'cancelled')) OR
        (v_current_status = 'preparing' AND p_new_status IN ('ready', 'cancelled')) OR
        (v_current_status = 'ready' AND p_new_status IN ('served', 'cancelled')) OR
        (v_current_status = 'served' AND p_new_status IN ('completed', 'cancelled')) OR
        (v_current_status = 'served' AND p_new_status = 'served')
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid status transition from ' || v_current_status || ' to ' || p_new_status
        );
    END IF;

    -- 4. ATOMIC STOCK RETURN on cancellation (idempotent)
    IF p_new_status = 'cancelled' AND v_stock_returned_at IS NULL THEN
        FOR item_record IN
            SELECT oi.id, oi.menu_item_id, oi.quantity
            FROM public.order_items oi
            WHERE oi.order_id = p_order_id AND oi.menu_item_id IS NOT NULL
        LOOP
            INSERT INTO public.inventory_transactions (inventory_item_id, type, quantity, notes, created_by)
            SELECT
                r.inventory_item_id,
                'in'::transaction_type,
                r.quantity * item_record.quantity,
                'Order Cancelled #' || p_order_id || ' (Item: ' || item_record.menu_item_id || ')',
                auth.uid()
            FROM public.recipes r
            WHERE r.menu_item_id = item_record.menu_item_id;
        END LOOP;
    END IF;

    -- 5. Perform the Update
    UPDATE public.orders
    SET
        status = p_new_status,
        version = version + 1,
        updated_at = now(),
        stock_returned_at = CASE
            WHEN p_new_status = 'cancelled' AND v_stock_returned_at IS NULL THEN now()
            ELSE stock_returned_at
        END
    WHERE id = p_order_id;

    -- 6. AUTO-FREE TABLE on completed or cancelled (H-03 fix)
    IF v_table_id IS NOT NULL AND p_new_status IN ('completed', 'cancelled') THEN
        UPDATE public.restaurant_tables
        SET status = 'available', current_order_id = NULL
        WHERE id = v_table_id;
    END IF;

    -- 7. Return the updated order
    SELECT jsonb_build_object(
        'success', true,
        'order', to_jsonb(o)
    ) INTO v_updated_order
    FROM public.orders o
    WHERE o.id = p_order_id;

    RETURN v_updated_order;
END;
$$;


-- 5. Re-grant
REVOKE ALL ON FUNCTION public.update_order_status(uuid, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text, int) TO authenticated;

REVOKE ALL ON FUNCTION public.create_order_atomic(uuid, text, text, numeric, numeric, numeric, numeric, text, text, text, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, text, text, numeric, numeric, numeric, numeric, text, text, text, jsonb, uuid) TO authenticated;


SELECT 'H-03 Table identity fix applied successfully' as status;
