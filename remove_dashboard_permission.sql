-- Remove dashboard from role_permissions table
-- Dashboard should be accessible by default for all logged-in users

-- 1. Delete dashboard permissions for all roles
DELETE FROM public.role_permissions
WHERE resource = 'dashboard';

-- 2. Verify it's gone
SELECT 'Remaining resources:' as info,
       resource
FROM public.role_permissions
GROUP BY resource
ORDER BY resource;

-- 3. Count resources per role
SELECT 'Resources per role:' as info,
       role,
       COUNT(*) as resource_count
FROM public.role_permissions
GROUP BY role
ORDER BY role;
