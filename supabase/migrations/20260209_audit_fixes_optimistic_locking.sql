-- Migration: Optimistic Locking for Order Updates
-- Purpose: Prevent concurrent overwrites of order status (e.g., in KDS).
-- Date: 2026-02-09

-- ============================================================================
-- 1. RPC for Safe Order Status Update with Optimistic Locking
-- ============================================================================
-- Requires the caller to pass the expected `version`. If it doesn't match,
-- the update is rejected (another process already updated it).

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
    v_updated_order JSONB;
BEGIN
    -- 1. Lock the row and get current state
    SELECT version, status INTO v_current_version, v_current_status
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

    -- 3. (Optional) Status Transition Validation
    -- Enforce valid transitions: pending -> preparing -> ready -> served
    -- cancelled can only come from pending or preparing
    IF NOT (
        (v_current_status = 'pending' AND p_new_status IN ('preparing', 'cancelled')) OR
        (v_current_status = 'preparing' AND p_new_status IN ('ready', 'cancelled')) OR
        (v_current_status = 'ready' AND p_new_status IN ('served', 'cancelled')) OR
        (v_current_status = 'served' AND p_new_status = 'served') -- idempotent
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid status transition from ' || v_current_status || ' to ' || p_new_status
        );
    END IF;

    -- 4. Perform the Update
    UPDATE public.orders
    SET
        status = p_new_status,
        version = version + 1,
        updated_at = now()
    WHERE id = p_order_id;

    -- 5. Return the updated order
    SELECT jsonb_build_object(
        'success', true,
        'order', to_jsonb(o)
    ) INTO v_updated_order
    FROM public.orders o
    WHERE o.id = p_order_id;

    RETURN v_updated_order;
END;
$$;

COMMENT ON FUNCTION public.update_order_status IS 'Updates order status with optimistic locking (version check) and state transition validation.';

GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT, INT) TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
SELECT 'Optimistic locking RPC for order updates applied successfully' as status;
