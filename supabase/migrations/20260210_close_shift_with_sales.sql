-- RPC: Close shift and auto-aggregate sales from orders
-- Queries all non-cancelled orders created during the shift period
-- and populates total_sales, cash_sales, card_sales, online_sales, total_orders, discounts_total

CREATE OR REPLACE FUNCTION public.close_shift_with_sales(
  p_shift_id UUID,
  p_closing_cash NUMERIC,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shift RECORD;
  v_sales RECORD;
  v_result JSONB;
BEGIN
  -- 1. Get the shift and verify it's open
  SELECT * INTO v_shift
  FROM public.shifts
  WHERE id = p_shift_id AND status = 'open';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift not found or already closed';
  END IF;

  -- 2. Aggregate sales from orders created during this shift
  SELECT
    COALESCE(COUNT(*), 0) AS total_orders,
    COALESCE(SUM(total), 0) AS total_sales,
    COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) AS cash_sales,
    COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0) AS card_sales,
    COALESCE(SUM(CASE WHEN payment_method = 'online' THEN total ELSE 0 END), 0) AS online_sales,
    COALESCE(SUM(discount), 0) AS discounts_total
  INTO v_sales
  FROM public.orders
  WHERE created_at >= v_shift.started_at
    AND created_at <= NOW()
    AND status NOT IN ('cancelled');

  -- 3. Update the shift with aggregated data
  UPDATE public.shifts
  SET
    ended_at = NOW(),
    closing_cash = p_closing_cash,
    notes = p_notes,
    status = 'closed',
    total_sales = v_sales.total_sales,
    total_orders = v_sales.total_orders,
    cash_sales = v_sales.cash_sales,
    card_sales = v_sales.card_sales,
    online_sales = v_sales.online_sales,
    discounts_total = v_sales.discounts_total
  WHERE id = p_shift_id;

  -- 4. Return the updated shift
  SELECT jsonb_build_object(
    'success', true,
    'shift', to_jsonb(s),
    'summary', jsonb_build_object(
      'total_orders', v_sales.total_orders,
      'total_sales', v_sales.total_sales,
      'cash_sales', v_sales.cash_sales,
      'card_sales', v_sales.card_sales,
      'online_sales', v_sales.online_sales,
      'discounts_total', v_sales.discounts_total,
      'cash_difference', p_closing_cash - v_shift.opening_cash - v_sales.cash_sales
    )
  )
  INTO v_result
  FROM public.shifts s
  WHERE s.id = p_shift_id;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute to authenticated users
REVOKE ALL ON FUNCTION public.close_shift_with_sales(UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_shift_with_sales(UUID, NUMERIC, TEXT) TO authenticated;
