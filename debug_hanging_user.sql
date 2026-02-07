-- Debug why queries hang for user: a7a43062-4c3c-480e-b0d2-b830f5d439fa

-- 1. Check if user exists in auth.users
SELECT 'User in auth.users:' as check,
       id,
       email,
       created_at
FROM auth.users
WHERE id = 'a7a43062-4c3c-480e-b0d2-b830f5d439fa';

-- 2. Check if profile exists (THIS might be hanging)
SELECT 'Profile exists:' as check,
       id,
       user_id,
       name,
       email
FROM public.profiles
WHERE user_id = 'a7a43062-4c3c-480e-b0d2-b830f5d439fa';

-- 3. Check if user_roles exists (THIS might be hanging)
SELECT 'User roles:' as check,
       id,
       user_id,
       role,
       warehouse_id
FROM public.user_roles
WHERE user_id = 'a7a43062-4c3c-480e-b0d2-b830f5d439fa';

-- 4. Check RLS policies on profiles
SELECT 'Profiles RLS:' as info,
       schemaname,
       tablename,
       policyname as name,
       permissive,
       cmd
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- 5. Check if SECURITY DEFINER functions exist
SELECT 'Security functions:' as info,
       proname as function_name,
       prosecdef as is_security_definer
FROM pg_proc
WHERE proname IN ('is_owner', 'is_owner_or_manager')
ORDER BY proname;
