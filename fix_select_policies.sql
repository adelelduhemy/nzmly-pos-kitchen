-- Simple fix: Ensure SELECT policies on profiles and user_roles work for authenticated users
-- These policies should allow users to read their own data without any complex checks

-- ============================================
-- FIX PROFILES TABLE
-- ============================================

-- Drop ALL existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;

-- Create ONE simple SELECT policy
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FIX USER_ROLES TABLE  
-- ============================================

-- Drop duplicate SELECT policies on user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create ONE simple SELECT policy that doesn't call any functions
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Verify policies
SELECT 'Profiles SELECT policies:' as info,
       polname,
       pg_get_expr(polqual, polrelid) as using_expression
FROM pg_policy
WHERE polrelid = 'public.profiles'::regclass
AND polcmd = 'r'
ORDER BY polname;

SELECT 'User_roles SELECT policies:' as info,
       polname,
       pg_get_expr(polqual, polrelid) as using_expression
FROM pg_policy
WHERE polrelid = 'public.user_roles'::regclass
AND polcmd = 'r'
ORDER BY polname;
