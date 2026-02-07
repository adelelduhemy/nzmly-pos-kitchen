-- Check DELETE policies on user_roles table

SELECT 'user_roles DELETE policies:' as info,
       polname as policy_name,
       pg_get_expr(polqual, polrelid) as using_expression,
       pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy
WHERE polrelid = 'public.user_roles'::regclass
AND polcmd = 'd'  -- 'd' = DELETE
ORDER BY polname;

-- Check all policies
SELECT 'All user_roles policies:' as info,
       polname as policy_name,
       CASE polcmd
         WHEN 'r' THEN 'SELECT'
         WHEN 'a' THEN 'INSERT'
         WHEN 'w' THEN 'UPDATE'
         WHEN 'd' THEN 'DELETE'
         WHEN '*' THEN 'ALL'
       END as command,
       pg_get_expr(polqual, polrelid) as using_expression
FROM pg_policy
WHERE polrelid = 'public.user_roles'::regclass
ORDER BY polcmd, polname;
