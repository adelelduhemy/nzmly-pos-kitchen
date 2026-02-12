-- RPC Function for Public Online Orders (Robust Version with Dish Name)
-- Handles: Guest Customer + Order Insert + Items + Loyalty Redemption
-- Safety: Handles empty settings table gracefully, includes dish_name in order_items

-- 1. DROP ALL conflicting versions first
DROP FUNCTION IF EXISTS create_online_order(text, text, text, text, text, numeric, numeric, numeric, jsonb, text);
DROP FUNCTION IF EXISTS create_online_order(text, text, text, text, text, numeric, numeric, numeric, jsonb, text, integer);

-- 2. CREATE the robust function
CREATE OR REPLACE FUNCTION create_online_order(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_customer_address TEXT,
    p_order_type TEXT,
    p_payment_method TEXT,
    p_subtotal NUMERIC,
    p_vat NUMERIC,
    p_total NUMERIC,
    p_items JSONB,
    p_notes TEXT DEFAULT '',
    p_redeemed_points INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_current_points INTEGER;
  v_loyalty_rate NUMERIC;
  v_discount_value NUMERIC := 0;
  v_final_total NUMERIC;
BEGIN
  -- 1. Create/Get Customer
  INSERT INTO public.customers (name, phone, address, created_at, updated_at)
  VALUES (p_customer_name, p_customer_phone, p_customer_address, now(), now())
  ON CONFLICT (phone) DO UPDATE
  SET name = EXCLUDED.name,
      address = COALESCE(NULLIF(EXCLUDED.address, ''), customers.address),
      updated_at = now()
  RETURNING id, loyalty_points INTO v_customer_id, v_current_points;

  -- 2. Generate Order Number
  v_order_number := 'ONL-' || upper(substr(md5(random()::text), 1, 6));

  -- 3. Handle Loyalty Redemption
  IF p_redeemed_points > 0 THEN
    IF v_current_points < p_redeemed_points THEN
      RAISE EXCEPTION 'Insufficient loyalty points. Have %, tried to redeem %', v_current_points, p_redeemed_points;
    END IF;

    -- Get rate (SAFE: Handles empty table)
    SELECT COALESCE((SELECT loyalty_redemption_value FROM restaurant_settings LIMIT 1), 0.10) 
    INTO v_loyalty_rate;

    v_discount_value := p_redeemed_points * v_loyalty_rate;
    
    -- Deduct points immediately
    UPDATE public.customers
    SET loyalty_points = loyalty_points - p_redeemed_points,
        updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  -- Calculate final total (Input total - discount)
  v_final_total := p_total - v_discount_value;
  IF v_final_total < 0 THEN v_final_total := 0; END IF;

  -- 4. Insert Order
  INSERT INTO public.orders (
    order_number, status, order_type,
    subtotal, vat, total, discount, 
    payment_method, payment_status,
    customer_id, created_at, updated_at
  ) VALUES (
    v_order_number, 'pending', p_order_type,
    p_subtotal, p_vat, 
    v_final_total, 
    v_discount_value, 
    p_payment_method, 'unpaid',
    v_customer_id, now(), now()
  ) RETURNING id INTO v_order_id;

  -- 5. Insert Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id, menu_item_id, dish_name, quantity, unit_price, total_price, notes
    ) VALUES (
      v_order_id,
      (v_item->>'menuItemId')::uuid,
      v_item->>'dishName',
      (v_item->>'quantity')::integer,
      (v_item->>'unitPrice')::numeric,
      (v_item->>'totalPrice')::numeric,
      v_item->>'notes'
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;
