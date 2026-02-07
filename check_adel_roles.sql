-- Check current state of user roles for adel.elduhemy@gmail.com

-- 1. Find the user ID
SELECT 'User ID search:' as info,
       id,
       email,
       created_at
FROM auth.users
WHERE email = 'adel.elduhemy@gmail.com';

-- 2. Check user_roles table (using the ID from above)
SELECT 'Current roles:' as info,
       id,
       user_id,
       role,
       warehouse_id,
       created_at
FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'adel.elduhemy@gmail.com'
);

-- 3. Check profiles table
SELECT 'Profile:' as info,
       id,
       user_id,
       name,
       email
FROM public.profiles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'adel.elduhemy@gmail.com'
);

-- 4. Check for duplicate roles
SELECT 'Duplicate roles check:' as info,
       user_id,
       role,
       COUNT(*) as count
FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'adel.elduhemy@gmail.com'
)
GROUP BY user_id, role
HAVING COUNT(*) > 1;
