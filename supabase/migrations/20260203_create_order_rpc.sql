-- RPC Function for Atomic Order Creation
-- Handles: Order Insert + Items Insert + Inventory Deduction (via triggers) in a SINGLE transaction
-- Ensures: Idempotency, Uniqueness, and Consistency

CREATE OR REPLACE FUNCTION create_order_atomic(
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

  -- 3. Generate Order Number (Sequential-ish to reduce collisions, but sticking to format)
  -- Better approach: Use a sequence or robust generator. For now, we improve the random part.
  -- Format: ORD-YYYYMMDD-XXXX
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
    order_number,
    status,
    order_type,
    table_number,
    subtotal,
    vat,
    discount,
    total,
    payment_method,
    payment_status,
    notes,
    cashier_id,
    idempotency_key,
    customer_id,
    version
  ) VALUES (
    v_order_number,
    'pending',
    p_order_type,
    p_table_number,
    p_subtotal,
    p_vat,
    p_discount,
    p_total,
    p_payment_method,
    p_payment_status,
    p_notes,
    v_user_id,
    p_idempotency_key,
    p_customer_id,
    1
  ) RETURNING id INTO v_order_id;

  -- 5. Insert Order Items
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
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'unitPrice')::NUMERIC,
      (v_item->>'totalPrice')::NUMERIC,
      v_item->>'notes'
    );
  END LOOP;

  -- 6. Return Result
  RETURN (
    SELECT jsonb_build_object(
      'order', to_jsonb(o),
      'status', 'created'
    )
    FROM public.orders o
    WHERE o.id = v_order_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;
