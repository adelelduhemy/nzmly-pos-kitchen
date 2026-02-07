-- Create the missing is_owner_or_manager function

-- Drop if exists to avoid errors
DROP FUNCTION IF EXISTS public.is_owner_or_manager(uuid);

-- Create the function
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_owner_or_manager(uuid) TO authenticated;

-- Test the function with current user
SELECT 'Function test:' as info,
       auth.uid() as current_user_id,
       public.is_owner_or_manager(auth.uid()) as is_owner_or_manager_result;

-- Verify function was created
SELECT 'Function created:' as info,
       proname as function_name,
       pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'is_owner_or_manager'
AND pronamespace = 'public'::regnamespace;
