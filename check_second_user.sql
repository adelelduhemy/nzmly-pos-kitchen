-- Check if user a7a43062-4c3c-480e-b0d2-b830f5d439fa has data

-- 1. User in auth
SELECT 'User exists:' as check,
       id,
       email,
       created_at
FROM auth.users
WHERE id = 'a7a43062-4c3c-480e-b0d2-b830f5d439fa';

-- 2. Profile exists?
SELECT 'Profile exists:' as check,
       COUNT(*) as count
FROM public.profiles
WHERE user_id = 'a7a43062-4c3c-480e-b0d2-b830f5d439fa';

-- 3. Roles exist?
SELECT 'Roles exist:' as check,
       COUNT(*) as count
FROM public.user_roles
WHERE user_id = 'a7a43062-4c3c-480e-b0d2-b830f5d439fa';

-- 4. If data exists, show it
SELECT 'User data:' as info,
       p.name,
       p.email,
       ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE p.user_id = 'a7a43062-4c3c-480e-b0d2-b830f5d439fa';
