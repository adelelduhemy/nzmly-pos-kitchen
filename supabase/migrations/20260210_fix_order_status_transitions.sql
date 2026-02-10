-- Fix: Allow served → completed and served → cancelled transitions
-- The original function only allowed served → served (idempotent)
-- But the Orders page needs served → completed to finalize orders

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

    -- 3. Status Transition Validation
    -- Enforce valid transitions:
    -- pending → preparing / cancelled
    -- preparing → ready / cancelled
    -- ready → served / cancelled
    -- served → completed / cancelled
    IF NOT (
        (v_current_status = 'pending' AND p_new_status IN ('preparing', 'cancelled')) OR
        (v_current_status = 'preparing' AND p_new_status IN ('ready', 'cancelled')) OR
        (v_current_status = 'ready' AND p_new_status IN ('served', 'cancelled')) OR
        (v_current_status = 'served' AND p_new_status IN ('completed', 'cancelled')) OR
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
