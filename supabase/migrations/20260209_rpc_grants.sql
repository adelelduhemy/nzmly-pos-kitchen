-- Migration: RPC REVOKE/GRANT Hardening
-- Purpose: Explicitly control who can execute security-sensitive RPCs
-- Date: 2026-02-09

-- ============================================================================
-- 1. REVOKE/GRANT for update_user_roles
-- ============================================================================
REVOKE ALL ON FUNCTION public.update_user_roles(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_roles(uuid, text[]) TO authenticated;

-- ============================================================================
-- 2. REVOKE/GRANT for adjust_inventory_stock
-- ============================================================================
REVOKE ALL ON FUNCTION public.adjust_inventory_stock(uuid, decimal, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_inventory_stock(uuid, decimal, text) TO authenticated;

-- ============================================================================
-- 3. REVOKE/GRANT for create_order_atomic
-- ============================================================================
REVOKE ALL ON FUNCTION public.create_order_atomic(uuid, text, text, numeric, numeric, numeric, numeric, text, text, text, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, text, text, numeric, numeric, numeric, numeric, text, text, text, jsonb, uuid) TO authenticated;

-- ============================================================================
-- 4. REVOKE/GRANT for update_order_status
-- ============================================================================
REVOKE ALL ON FUNCTION public.update_order_status(uuid, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text, int) TO authenticated;

-- ============================================================================
-- 5. REVOKE/GRANT for return_order_stock
-- ============================================================================
REVOKE ALL ON FUNCTION public.return_order_stock(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.return_order_stock(uuid) TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
SELECT 'RPC REVOKE/GRANT hardening applied successfully' as status;
