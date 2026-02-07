-- Debug: Check if the current authenticated user can delete roles

-- 1. Who am I?
SELECT 'Current authenticated user:' as info,
       auth.uid() as my_user_id,
       auth.email() as my_email;

-- 2. What are my roles?
SELECT 'My roles:' as info,
       role,
       user_id
FROM public.user_roles
WHERE user_id = auth.uid();

-- 3. Does is_owner_or_manager work for me?
SELECT 'Am I owner or manager?:' as info,
       public.is_owner_or_manager(auth.uid()) as result;

-- 4. Check adel's roles directly (as service role, bypassing RLS)
SELECT 'Adel roles (service role):' as info,
       id,
       role,
       user_id,
       created_at
FROM public.user_roles
WHERE user_id = '7164c2c5-aaf1-4c77-94c7-7db48d6f2efa';

-- 5. Show the DELETE policy definition
SELECT 'DELETE policy:' as info,
       polname,
       pg_get_expr(polqual, polrelid) as using_clause
FROM pg_policy
WHERE polrelid = 'public.user_roles'::regclass
AND polcmd = 'd';
