-- Check if user has owner role and permissions
SELECT 
  'Checking user roles and permissions for adel.elduhemy@gmail.com' as step;

-- 1. Find the user
SELECT 
  'User ID:' as info,
  id,
  email
FROM auth.users 
WHERE email = 'adel.elduhemy@gmail.com';

-- 2. Check user_roles table
SELECT 
  'User Roles:' as info,
  ur.id,
  ur.user_id,
  ur.role,
  ur.warehouse_id
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'adel.elduhemy@gmail.com';

-- 3. Check role_permissions table
SELECT 
  'Role Permissions:' as info,
  rp.role,
  rp.resource,
  rp.can_view,
  rp.can_edit,
  rp.can_delete
FROM public.role_permissions rp
WHERE rp.role = 'owner'
ORDER BY rp.resource;

-- 4. Check if role_permissions table exists and has data
SELECT 
  'Total permissions in system:' as info,
  COUNT(*) as count
FROM public.role_permissions;

-- 5. Check profiles table
SELECT 
  'User Profile:' as info,
  p.id,
  p.user_id,
  p.name,
  p.email
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'adel.elduhemy@gmail.com';
