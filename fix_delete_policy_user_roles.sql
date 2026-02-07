-- Fix: Add DELETE policy for owners/managers to delete any user_roles

-- Drop existing restrictive DELETE policies if any
DROP POLICY IF EXISTS "Users can delete own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete roles" ON public.user_roles;

-- Create new DELETE policy: Owners and managers can delete any user's roles
CREATE POLICY "Owners and managers can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    public.is_owner_or_manager(auth.uid())
  );

-- Verify policy was added
SELECT 'DELETE policies after fix:' as info,
       polname as policy_name,
       pg_get_expr(polqual, polrelid) as using_expression
FROM pg_policy
WHERE polrelid = 'public.user_roles'::regclass
AND polcmd = 'd'
ORDER BY polname;
