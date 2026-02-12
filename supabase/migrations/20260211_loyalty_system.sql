-- =====================================================
-- Loyalty Points System
-- =====================================================
-- 1. Add loyalty config columns to restaurant_settings
-- 2. Create trigger to auto-award points on order completion
-- 3. Create function to redeem points at checkout
-- =====================================================

-- 1. Add loyalty configuration columns
ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS loyalty_points_per_sar INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS loyalty_redemption_value NUMERIC(10,2) DEFAULT 0.10;

-- 2. Auto-award loyalty points when order is completed
CREATE OR REPLACE FUNCTION public.auto_award_loyalty_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points_per_sar INTEGER;
  v_earned_points INTEGER;
BEGIN
  -- Only fire when status changes TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Only for orders linked to a customer
    IF NEW.customer_id IS NOT NULL THEN
      -- Get the conversion rate from settings
      SELECT COALESCE(loyalty_points_per_sar, 1)
        INTO v_points_per_sar
        FROM restaurant_settings
        LIMIT 1;

      -- Calculate points earned: floor(total * rate)
      v_earned_points := FLOOR(NEW.total * v_points_per_sar);

      -- Award points to customer
      IF v_earned_points > 0 THEN
        UPDATE customers
        SET loyalty_points = COALESCE(loyalty_points, 0) + v_earned_points,
            updated_at = now()
        WHERE id = NEW.customer_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to orders table
DROP TRIGGER IF EXISTS trg_auto_award_loyalty_points ON public.orders;
CREATE TRIGGER trg_auto_award_loyalty_points
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_award_loyalty_points();

-- 3. Redeem loyalty points (called from POS checkout)
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(
  p_customer_id UUID,
  p_points INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_points INTEGER;
  v_redemption_value NUMERIC;
  v_discount NUMERIC;
BEGIN
  -- Get current points
  SELECT COALESCE(loyalty_points, 0)
    INTO v_current_points
    FROM customers
    WHERE id = p_customer_id;

  IF v_current_points IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  IF p_points > v_current_points THEN
    RAISE EXCEPTION 'Insufficient points. Customer has % points, tried to redeem %', v_current_points, p_points;
  END IF;

  IF p_points <= 0 THEN
    RAISE EXCEPTION 'Points to redeem must be positive';
  END IF;

  -- Get redemption value from settings
  SELECT COALESCE(loyalty_redemption_value, 0.10)
    INTO v_redemption_value
    FROM restaurant_settings
    LIMIT 1;

  -- Calculate discount
  v_discount := p_points * v_redemption_value;

  -- Deduct points
  UPDATE customers
  SET loyalty_points = loyalty_points - p_points,
      updated_at = now()
  WHERE id = p_customer_id;

  RETURN json_build_object(
    'success', true,
    'points_redeemed', p_points,
    'discount', v_discount,
    'remaining_points', v_current_points - p_points
  );
END;
$$;
