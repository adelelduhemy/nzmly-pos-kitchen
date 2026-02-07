-- Test if RLS policies are blocking queries
-- Run this in Supabase SQL Editor

-- 1. Check if you can read your own profile
SELECT 
  'Your Profile:' as test,
  p.*
FROM public.profiles p  
WHERE p.user_id = auth.uid();

-- 2. Check if you can read your own roles
SELECT 
  'Your Roles:' as test,
  ur.*
FROM public.user_roles ur
WHERE ur.user_id = auth.uid();

-- 3. Check RLS policies on profiles table
SELECT 
  'Profiles RLS Policies:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 4. Check RLS policies on user_roles table  
SELECT 
  'User Roles RLS Policies:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles';

-- 5. Test the exact query that's hanging
SELECT 
  'Testing exact query:' as test;
  
SELECT * FROM public.profiles 
WHERE user_id = (SELECT auth.uid()) 
LIMIT 1;

SELECT * FROM public.user_roles
WHERE user_id = (SELECT auth.uid());
