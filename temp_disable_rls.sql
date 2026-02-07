-- TEMPORARY FIX: Disable RLS on profiles and user_roles
-- This will prove if RLS is the issue
-- WARNING: Only for debugging, not for production!

-- Disable RLS on profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on user_roles  
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  'RLS Status:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'user_roles')
ORDER BY tablename;
