-- Fix: Cast text to app_role enum in the function

CREATE OR REPLACE FUNCTION public.update_user_roles(
  target_user_id uuid,
  new_roles text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow owners and managers to call this function
  IF NOT public.is_owner_or_manager(auth.uid()) THEN
    RAISE EXCEPTION 'Only owners and managers can update user roles';
  END IF;

  -- Delete all existing roles for the target user
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id;

  -- Insert new roles (with proper type casting)
  IF array_length(new_roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, role, warehouse_id)
    SELECT target_user_id, role::app_role, NULL
    FROM unnest(new_roles) AS role;
  END IF;
END;
$$;

-- Verify
SELECT 'Function updated successfully' as info;
