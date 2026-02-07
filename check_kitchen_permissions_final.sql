-- Check what permissions the kitchen role has

SELECT 'Kitchen role permissions:' as info,
       id,
       role,
       resource,
       can_view,
       can_edit,
       can_delete,
       created_at
FROM public.role_permissions
WHERE role = 'kitchen'
ORDER BY resource;

-- Count permissions
SELECT 'Permission summary:' as info,
       COUNT(*) as total_resources,
       COUNT(CASE WHEN can_view THEN 1 END) as can_view_count,
       COUNT(CASE WHEN can_edit THEN 1 END) as can_edit_count,
       COUNT(CASE WHEN can_delete THEN 1 END) as can_delete_count
FROM public.role_permissions
WHERE role = 'kitchen';
