-- Fix the infinite recursion in user_roles RLS policy
-- The problem: "Owners can manage all roles" policy checks user_roles to see if you're owner
-- This creates infinite loop when trying to read user_roles

-- Drop the problematic policy
DROP POLICY IF EXISTS "Owners can manage all roles" ON public.user_roles;

-- Recreate it with a security definer function to break the recursion
-- First, create a function that checks if user is owner (runs with elevated privileges)
CREATE OR REPLACE FUNCTION public.is_owner(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_id_param
    AND role = 'owner'
  );
END;
$$;

-- Now create the policy using the function (avoids recursion)
CREATE POLICY "Owners can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

-- Verify policies
SELECT 'Updated policies:' as info, policyname, cmd
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;
