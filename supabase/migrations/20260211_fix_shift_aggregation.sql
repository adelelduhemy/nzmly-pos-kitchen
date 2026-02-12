-- ============================================================================
-- H-05 Fix: Shift Aggregation + Ownership Guard
-- Problem: close_shift_with_sales uses time-range only, no ownership check,
--          and concurrent/overlapping shifts can mix sales data.
-- Fix: Add shift_id FK on orders (done in table_identity migration),
--       add ownership check, aggregate by shift_id if available.
-- Date: 2026-02-11
-- ============================================================================

-- 1. Add shift_id to orders (if not yet added by table_identity migration)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL;

-- 2. Backfill: link existing orders to shifts based on time overlap
UPDATE public.orders o
SET shift_id = (
  SELECT s.id FROM public.shifts s
  WHERE s.started_at <= o.created_at
    AND (s.ended_at IS NULL OR s.ended_at >= o.created_at)
    AND s.status IN ('open', 'closed')
  ORDER BY s.started_at DESC
  LIMIT 1
)
WHERE o.shift_id IS NULL;

-- 3. Recreate close_shift_with_sales with ownership check + shift_id aggregation
CREATE OR REPLACE FUNCTION public.close_shift_with_sales(
  p_shift_id UUID,
  p_closing_cash NUMERIC,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shift RECORD;
  v_sales RECORD;
  v_result JSONB;
  v_caller_role TEXT;
BEGIN
  -- 0. Role Guard: only shift owner, owner, or manager can close
  SELECT role INTO v_caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- 1. Get the shift and verify it's open
  SELECT * INTO v_shift
  FROM public.shifts
  WHERE id = p_shift_id AND status = 'open';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift not found or already closed';
  END IF;

  -- 2. Ownership check: only the shift owner or owner/manager can close
  IF v_shift.user_id != auth.uid() AND v_caller_role NOT IN ('owner', 'manager') THEN
    RAISE EXCEPTION 'Unauthorized: only the shift owner or a manager can close this shift';
  END IF;

  -- 3. Aggregate sales — prefer shift_id linkage, fallback to time range
  SELECT
    COALESCE(COUNT(*), 0) AS total_orders,
    COALESCE(SUM(total), 0) AS total_sales,
    COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) AS cash_sales,
    COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0) AS card_sales,
    COALESCE(SUM(CASE WHEN payment_method = 'online' THEN total ELSE 0 END), 0) AS online_sales,
    COALESCE(SUM(discount), 0) AS discounts_total
  INTO v_sales
  FROM public.orders
  WHERE (
    -- Primary: aggregate by shift_id (accurate)
    shift_id = p_shift_id
    OR (
      -- Fallback: time range for legacy orders without shift_id
      shift_id IS NULL
      AND created_at >= v_shift.started_at
      AND created_at <= NOW()
    )
  )
  AND status NOT IN ('cancelled');

  -- 4. Update the shift with aggregated data
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

  -- 5. Return the updated shift
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

-- Re-grant
REVOKE ALL ON FUNCTION public.close_shift_with_sales(UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_shift_with_sales(UUID, NUMERIC, TEXT) TO authenticated;


SELECT 'H-05 Shift aggregation fix applied successfully' as status;
