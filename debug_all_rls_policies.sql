-- Check ALL RLS policies that might be causing the hang

-- 1. List ALL policies on user_roles (verbose)
SELECT 
  'user_roles policies:' as table_name,
  polname as policy_name,
  polcmd as command,
  CASE polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'  
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command_name,
  pg_get_expr(polqual, polrelid) as using_expression,
  pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy
WHERE polrelid = 'public.user_roles'::regclass
ORDER BY polname;

-- 2. List ALL policies on profiles (verbose)
SELECT 
  'profiles policies:' as table_name,
  polname as policy_name,
  polcmd as command,
  CASE polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command_name,
  pg_get_expr(polqual, polrelid) as using_expression,
  pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy
WHERE polrelid = 'public.profiles'::regclass
ORDER BY polname;

-- 3. Test if we can manually run the same query the frontend runs
-- This should work if you're logged in as adel.elduhemy@gmail.com
SELECT 'Test direct query:' as test;

-- Test profiles query (might hang)
SELECT * FROM public.profiles 
WHERE user_id = '7164c2c5-aaf1-4c77-94c7-7db48d6f2efa'
LIMIT 1;

-- Test user_roles query (might hang)
SELECT * FROM public.user_roles
WHERE user_id = '7164c2c5-aaf1-4c77-94c7-7db48d6f2efa';
