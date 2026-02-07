-- Test ONLY the profiles table
-- Run this separately to see what's wrong with profiles

-- First, check if the table exists
SELECT 'Table exists:' as check, COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Check if RLS is enabled
SELECT 'RLS status:' as check, 
       tablename, 
       rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Check what policies exist
SELECT 'Policies:' as check,
       policyname,
       cmd,
       CASE 
         WHEN cmd = 'SELECT' THEN 'Can read'
         WHEN cmd = 'INSERT' THEN 'Can create'
         WHEN cmd = 'UPDATE' THEN 'Can modify'
         WHEN cmd = 'DELETE' THEN 'Can delete'
         WHEN cmd = 'ALL' THEN 'Full access'
       END as permission_type
FROM pg_policies
WHERE tablename = 'profiles';

-- Try to read your profile directly
SELECT 'Your auth.uid():' as check, auth.uid() as your_user_id;

-- Try to read from profiles table (this might hang if RLS blocks it)
SELECT 'Your profile data:' as check, *
FROM public.profiles
WHERE user_id = auth.uid()
LIMIT 1;
