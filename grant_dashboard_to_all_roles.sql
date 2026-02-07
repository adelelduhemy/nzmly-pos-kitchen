-- Grant dashboard view permission to ALL roles
-- This allows all users to login regardless of their role

UPDATE public.role_permissions
SET can_view = true,
    updated_at = NOW()
WHERE resource = 'dashboard';

-- Verify all roles now have dashboard access
SELECT 'All roles dashboard permissions:' as info,
       role,
       resource,
       can_view,
       can_edit,
       can_delete
FROM public.role_permissions
WHERE resource = 'dashboard'
ORDER BY role;

-- Summary
SELECT 'Summary:' as info,
       COUNT(*) as total_roles,
       COUNT(CASE WHEN can_view THEN 1 END) as can_view_dashboard
FROM public.role_permissions
WHERE resource = 'dashboard';
