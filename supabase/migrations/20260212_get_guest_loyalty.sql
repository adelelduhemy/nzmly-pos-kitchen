-- RPC to check loyalty balance for guest via phone number
CREATE OR REPLACE FUNCTION get_guest_loyalty_balance(p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points INTEGER;
  v_name TEXT;
  v_rate NUMERIC;
BEGIN
  -- 1. Find customer
  SELECT loyalty_points, name
    INTO v_points, v_name
    FROM customers
    WHERE phone = p_phone
    LIMIT 1;

  IF v_points IS NULL THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  -- 2. Get redemption rate
  SELECT COALESCE(loyalty_redemption_value, 0.10)
    INTO v_rate
    FROM restaurant_settings
    LIMIT 1;

  -- 3. Return details
  RETURN jsonb_build_object(
    'exists', true,
    'points', COALESCE(v_points, 0),
    'name', v_name, -- Frontend can use this to confirm "Welcome back, Ahmed!"
    'redemption_rate', v_rate,
    'max_discount', floor(COALESCE(v_points, 0) * v_rate * 100) / 100
  );
END;
$$;
