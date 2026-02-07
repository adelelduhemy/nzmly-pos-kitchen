-- Test if the is_owner function exists
SELECT 'Function exists:' as check, 
       proname as function_name,
       pronargs as num_args
FROM pg_proc 
WHERE proname = 'is_owner';

-- Test the current RLS policy (fixed column name)
SELECT 'Current policy:' as check,
       polname as policy_name,
       pg_get_expr(polqual, polrelid) as using_clause
FROM pg_policy
WHERE polrelid = 'public.user_roles'::regclass
AND polname = 'Owners can manage all roles';

-- Also check what's actually blocking the queries
SELECT 'All user_roles policies:' as info,
       polname,
       polcmd,
       pg_get_expr(polqual, polrelid) as using_expression
FROM pg_policy
WHERE polrelid = 'public.user_roles'::regclass
ORDER BY polname;
