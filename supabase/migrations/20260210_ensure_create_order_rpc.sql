-- Fix: Ensure create_order_atomic has p_customer_id parameter
-- Fixed JSON key names to match frontend camelCase format
-- Added dish_name column which is NOT NULL in order_items

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

  -- 3. Generate Order Number (YYMMDD-XXXX)
  v_order_number := to_char(now(), 'YYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));

  -- 4. Insert Order
  INSERT INTO public.orders (
    order_number,
    cashier_id,
    order_type,
    table_number,
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

  -- 5. Insert Order Items
  -- Frontend sends camelCase keys: menuItemId, dishName, quantity, unitPrice, totalPrice, notes
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

  -- 6. Return new order info
  RETURN json_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'status', 'pending',
    'is_duplicate', false
  );
END;
$$;
