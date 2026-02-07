-- Check what permissions the kitchen role has

SELECT 'Kitchen role permissions:' as info,
       *
FROM public.role_permissions
WHERE role = 'kitchen';

-- Also check the schema to see column names
SELECT 'All kitchen permissions:' as info,
       role,
       resource,
       view_permission,
       create_permission,
       edit_permission,
       delete_permission
FROM public.role_permissions
WHERE role = 'kitchen'
ORDER BY resource;
