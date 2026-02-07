-- Check if the kitchen user (l.elduhemy@gmail.com) has profile and roles

-- 1. Find the user by email in auth.users (service role only)
SELECT 'User ID lookup:' as info,
       'be55c5ac-9cf6-41e0-afb9-b85aada17e6d' as user_id,
       'l.elduhemy@gmail.com' as email;

-- 2. Check if profile exists
SELECT 'Profile exists?:' as info,
       COUNT(*) as profile_count,
       user_id,
       name
FROM public.profiles
WHERE user_id = 'be55c5ac-9cf6-41e0-afb9-b85aada17e6d'
GROUP BY user_id, name;

-- 3. Check if roles exist
SELECT 'Roles exist?:' as info,
       COUNT(*) as role_count,
       array_agg(role) as roles
FROM public.user_roles
WHERE user_id = 'be55c5ac-9cf6-41e0-afb9-b85aada17e6d';

-- 4. Show actual roles
SELECT 'Actual roles:' as info,
       id,
       user_id,
       role,
       created_at
FROM public.user_roles
WHERE user_id = 'be55c5ac-9cf6-41e0-afb9-b85aada17e6d';
