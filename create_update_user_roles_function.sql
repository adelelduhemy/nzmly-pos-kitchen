-- Create a SECURITY DEFINER function to update user roles
-- This bypasses RLS and allows owners/managers to update any user's roles

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

  -- Insert new roles
  IF array_length(new_roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, role, warehouse_id)
    SELECT target_user_id, role::text, NULL
    FROM unnest(new_roles) AS role;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_user_roles(uuid, text[]) TO authenticated;

-- Test the function
SELECT 'Function created successfully' as info;
