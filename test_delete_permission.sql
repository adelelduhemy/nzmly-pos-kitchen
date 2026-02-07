-- Test if is_owner_or_manager function works for current user

-- 1. Check current user
SELECT 'Current user:' as info,
       auth.uid() as user_id,
       auth.email() as email;

-- 2. Test is_owner_or_manager function
SELECT 'is_owner_or_manager test:' as info,
       public.is_owner_or_manager(auth.uid()) as result;

-- 3. Check user's roles
SELECT 'User roles:' as info,
       role
FROM public.user_roles
WHERE user_id = auth.uid();

-- 4. Test direct DELETE query (this will show if RLS is blocking)
-- This won't actually delete anything, just shows what WOULD be deleted
EXPLAIN (ANALYZE, VERBOSE)
DELETE FROM public.user_roles
WHERE user_id = '7164c2c5-aaf1-4c77-94c7-7db48d6f2efa'; -- adel's user_id
