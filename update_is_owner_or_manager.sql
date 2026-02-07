-- Replace the is_owner_or_manager function (without dropping)
-- This will update it if it exists or create it if it doesn't

CREATE OR REPLACE FUNCTION public.is_owner_or_manager(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = user_id_param
    AND role IN ('owner', 'manager')
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_owner_or_manager(uuid) TO authenticated;

-- Test the function with current user
SELECT 'Function test:' as info,
       auth.uid() as current_user_id,
       public.is_owner_or_manager(auth.uid()) as is_owner_or_manager_result;

-- Check current user's roles
SELECT 'Current user roles:' as info,
       role
FROM public.user_roles
WHERE user_id = auth.uid();
