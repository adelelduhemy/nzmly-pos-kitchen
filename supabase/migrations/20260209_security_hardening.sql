-- Migration: Security Hardening
-- Purpose: Add top-level permission checks to security-sensitive functions
-- Date: 2026-02-09

-- ============================================================================
-- 1. Add Top-Level Permission Guard to update_user_roles
-- ============================================================================
-- Currently any authenticated user can call this function (internal checks exist).
-- Add an early rejection for non-owner/manager callers.

CREATE OR REPLACE FUNCTION public.update_user_roles(
  target_user_id uuid,
  new_roles text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_is_owner BOOLEAN;
  caller_is_manager BOOLEAN;
  target_is_owner BOOLEAN;
  new_role text;
BEGIN
  -- TOP-LEVEL GUARD: Only owners or managers can call this function
  IF NOT public.is_owner_or_manager(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: Only owners or managers can modify user roles';
  END IF;

  -- Check caller permissions
  caller_is_owner := public.is_owner(auth.uid());
  caller_is_manager := public.is_owner_or_manager(auth.uid()) AND NOT caller_is_owner;
  
  -- Check target status
  target_is_owner := public.is_owner(target_user_id);
  
  -- RULE 1: Self-modification is NEVER allowed (by anyone)
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify your own roles';
  END IF;
  
  -- RULE 2: Only owners can modify owner users
  IF target_is_owner AND NOT caller_is_owner THEN
    RAISE EXCEPTION 'Permission denied: Only owners can modify owner privileges';
  END IF;
  
  -- RULE 3: Only owners can assign/remove the owner role
  IF NOT caller_is_owner THEN
    FOREACH new_role IN ARRAY new_roles LOOP
      IF new_role = 'owner' THEN
        RAISE EXCEPTION 'Permission denied: Only owners can assign the owner role';
      END IF;
    END LOOP;
  END IF;

  -- Delete all existing roles for the target user
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id;

  -- Insert new roles
  IF array_length(new_roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, role, warehouse_id)
    SELECT target_user_id, role::app_role, NULL
    FROM unnest(new_roles) AS role;
  END IF;
END;
$$;

-- ============================================================================
-- 2. Add Permission Check to adjust_inventory_stock
-- ============================================================================
-- Currently any authenticated user can adjust stock. Restrict to inventory/owner/manager.

CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
  p_item_id UUID,
  p_quantity DECIMAL,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous_stock DECIMAL;
  v_new_stock DECIMAL;
  v_transaction_type transaction_type;
BEGIN
  -- TOP-LEVEL GUARD: Only inventory managers can adjust stock
  IF NOT public.can_manage_inventory(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: You do not have permission to manage inventory';
  END IF;

  -- Lock the row and get current stock
  SELECT current_stock INTO v_previous_stock
  FROM inventory_items
  WHERE id = p_item_id
  FOR UPDATE;

  -- Calculate new stock
  v_new_stock := v_previous_stock + p_quantity;

  -- Prevent negative stock
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Insufficient stock. Current: %, Requested: %', v_previous_stock, -p_quantity;
  END IF;

  -- Update stock
  UPDATE inventory_items
  SET current_stock = v_new_stock
  WHERE id = p_item_id;

  -- Determine transaction type
  IF p_quantity > 0 THEN
    v_transaction_type := 'in';
  ELSE
    v_transaction_type := 'out';
  END IF;

  -- Record transaction
  INSERT INTO inventory_transactions (
    inventory_item_id,
    type,
    quantity,
    notes,
    created_by
  ) VALUES (
    p_item_id,
    v_transaction_type,
    ABS(p_quantity),
    p_reason,
    auth.uid()
  );

  -- Return result
  RETURN json_build_object(
    'previous_stock', v_previous_stock,
    'new_stock', v_new_stock,
    'quantity_changed', p_quantity
  );
END;
$$;

-- ============================================================================
-- 3. Add SET search_path to create_order_atomic
-- ============================================================================
-- Required for SECURITY DEFINER functions to prevent search_path injection.

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
  v_order_id UUID;
  v_order_number TEXT;
  v_existing_order JSONB;
  v_item JSONB;
  v_date_str TEXT;
  v_random_suffix TEXT;
  v_user_id UUID;
BEGIN
  -- 1. Check Idempotency
  SELECT jsonb_build_object('order', to_jsonb(o), 'status', 'existing')
  INTO v_existing_order
  FROM public.orders o
  WHERE o.idempotency_key = p_idempotency_key;

  IF v_existing_order IS NOT NULL THEN
    RETURN v_existing_order;
  END IF;

  -- 2. Get User ID (Cashier)
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 3. Generate Order Number
  v_date_str := to_char(now(), 'YYYYMMDD');
  v_random_suffix := lpad(floor(random() * 10000)::text, 4, '0');
  v_order_number := 'ORD-' || v_date_str || '-' || v_random_suffix;

  -- Ensure uniqueness loop (simple retry)
  WHILE EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_order_number) LOOP
    v_random_suffix := lpad(floor(random() * 10000)::text, 4, '0');
    v_order_number := 'ORD-' || v_date_str || '-' || v_random_suffix;
  END LOOP;

  -- 4. Insert Order
  INSERT INTO public.orders (
    idempotency_key,
    order_type,
    table_number,
    subtotal,
    vat,
    discount,
    total,
    payment_method,
    payment_status,
    notes,
    order_number,
    status,
    cashier_id,
    customer_id,
    version
  ) VALUES (
    p_idempotency_key,
    p_order_type,
    p_table_number,
    p_subtotal,
    p_vat,
    p_discount,
    p_total,
    p_payment_method,
    p_payment_status,
    p_notes,
    v_order_number,
    'pending',
    v_user_id,
    p_customer_id,
    1
  )
  RETURNING id INTO v_order_id;

  -- 5. Insert Order Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      dish_id,
      menu_item_id,
      dish_name,
      quantity,
      unit_price,
      total_price,
      notes
    ) VALUES (
      v_order_id,
      (v_item->>'dishId')::uuid,
      (v_item->>'menuItemId')::uuid,
      v_item->>'dishName',
      (v_item->>'quantity')::int,
      (v_item->>'unitPrice')::numeric,
      (v_item->>'totalPrice')::numeric,
      v_item->>'notes'
    );
  END LOOP;

  -- 6. Return the created order
  RETURN jsonb_build_object(
    'order', (SELECT to_jsonb(o) FROM public.orders o WHERE o.id = v_order_id),
    'status', 'created'
  );
END;
$$;

-- ============================================================================
-- 4. Add Unique Index for user_roles (handles NULL warehouse_id)
-- ============================================================================
-- Prevents duplicate (user_id, role) when warehouse_id is NULL.

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique_no_warehouse
ON public.user_roles (user_id, role)
WHERE warehouse_id IS NULL;

-- ============================================================================
-- Migration Complete
-- ============================================================================
SELECT 'Security hardening migration applied successfully' as status;
