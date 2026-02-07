-- Migration: Hierarchical Owner/Manager Role Protection
-- Created: Feb 5, 2026
-- Purpose: Owners can modify anyone. Managers can modify anyone except owners and themselves.

-- ============================================================================
-- 1. Create Helper Function: Check if a specific user has owner role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_owner(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = target_user_id
    AND role = 'owner'
  );
END;
$$;

COMMENT ON FUNCTION public.is_owner(UUID) IS 'Check if a specific user has the owner role';

GRANT EXECUTE ON FUNCTION public.is_owner(UUID) TO authenticated;

-- ============================================================================
-- 2. Update update_user_roles Function with Hierarchical Protection
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_user_roles(
  target_user_id uuid,
  new_roles text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_is_owner BOOLEAN;
  caller_is_manager BOOLEAN;
  target_is_owner BOOLEAN;
  new_role text;
BEGIN
  -- Check caller permissions
  caller_is_owner := public.is_owner(auth.uid());
  caller_is_manager := public.is_owner_or_manager(auth.uid()) AND NOT caller_is_owner;
  
  -- Check target status
  target_is_owner := public.is_owner(target_user_id);
  
  -- RULE 1: Self-modification is NEVER allowed (by anyone)
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify your own roles';
  END IF;
  
  -- RULE 2: Only owners can modify owner users
  IF target_is_owner AND NOT caller_is_owner THEN
    RAISE EXCEPTION 'Permission denied: Only owners can modify owner privileges';
  END IF;
  
  -- RULE 3: Only owners can assign/remove the owner role
  IF NOT caller_is_owner THEN
    FOREACH new_role IN ARRAY new_roles LOOP
      IF new_role = 'owner' THEN
        RAISE EXCEPTION 'Permission denied: Only owners can assign the owner role';
      END IF;
    END LOOP;
  END IF;

  -- Delete all existing roles for the target user
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id;

  -- Insert new roles
  IF array_length(new_roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, role, warehouse_id)
    SELECT target_user_id, role::text, NULL
    FROM unnest(new_roles) AS role;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.update_user_roles(uuid, text[]) IS 'Update user roles with hierarchical protection';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_user_roles(uuid, text[]) TO authenticated;

-- ============================================================================
-- 3. Helper Function: Check if user can manage permissions for a specific role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_manage_role_permissions(caller_id UUID, target_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Owners can manage all role permissions
  IF public.is_owner(caller_id) THEN
    RETURN true;
  END IF;
  
  -- Managers can only manage lower-tier role permissions (cashier, kitchen, inventory)
  IF public.is_owner_or_manager(caller_id) AND NOT public.is_owner(caller_id) THEN
    RETURN target_role IN ('cashier', 'kitchen', 'inventory');
  END IF;
  
  -- Everyone else cannot manage any permissions
  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.can_manage_role_permissions(UUID, TEXT) IS 'Check if caller can manage permissions for a specific role';

GRANT EXECUTE ON FUNCTION public.can_manage_role_permissions(UUID, TEXT) TO authenticated;

-- ============================================================================
-- 4. Update RLS Policies on user_roles Table
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can manage non-owner roles" ON public.user_roles;

-- Policy: Anyone can view roles (needed for UI display)
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Owners can manage ALL roles (including owner roles)
CREATE POLICY "Owners can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

-- Policy: Managers can manage non-owner users only
CREATE POLICY "Managers can manage non-owner users"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    public.is_owner_or_manager(auth.uid()) 
    AND NOT public.is_owner(auth.uid())
    AND NOT public.is_owner(user_id)
  )
  WITH CHECK (
    public.is_owner_or_manager(auth.uid()) 
    AND NOT public.is_owner(auth.uid())
    AND NOT public.is_owner(user_id)
  );

-- ============================================================================
-- 5. Update RLS Policies on role_permissions Table
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Only owners can manage permissions" ON public.role_permissions;

-- Policy: Anyone can read permissions
CREATE POLICY "Public read access for permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Owners can manage all permissions
CREATE POLICY "Owners can manage all permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

-- Policy: Managers can manage lower-tier role permissions only
CREATE POLICY "Managers can manage lower tier permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (
    public.is_owner_or_manager(auth.uid()) 
    AND NOT public.is_owner(auth.uid())
    AND role IN ('cashier', 'kitchen', 'inventory')
  )
  WITH CHECK (
    public.is_owner_or_manager(auth.uid()) 
    AND NOT public.is_owner(auth.uid())
    AND role IN ('cashier', 'kitchen', 'inventory')
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT 'Owner/Manager hierarchical protection migration applied successfully' as status;
