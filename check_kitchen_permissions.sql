-- Check what permissions the kitchen role has

SELECT 'Kitchen role permissions:' as info,
       *
FROM public.role_permissions
WHERE role = 'kitchen';

-- Count permissions
SELECT 'Permission count:' as info,
       COUNT(*) as total,
       COUNT(CASE WHEN can_view THEN 1 END) as can_view_count,
       COUNT(CASE WHEN can_create THEN 1 END) as can_create_count,
       COUNT(CASE WHEN can_edit THEN 1 END) as can_edit_count,
       COUNT(CASE WHEN can_delete THEN 1 END) as can_delete_count
FROM public.role_permissions
WHERE role = 'kitchen';
