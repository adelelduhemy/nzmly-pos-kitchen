-- Fix SELECT policy to allow owners/managers to view all user roles

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Create new SELECT policy: Users can view their own roles, owners/managers can view all
CREATE POLICY "Users can view roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id  -- Users can see their own roles
    OR 
    public.is_owner_or_manager(auth.uid())  -- Owners/managers can see all roles
  );

-- Verify policy
SELECT 'New SELECT policy:' as info,
       polname as policy_name,
       pg_get_expr(polqual, polrelid) as using_expression
FROM pg_policy
WHERE polrelid = 'public.user_roles'::regclass
AND polcmd = 'r'  -- 'r' = SELECT
ORDER BY polname;
