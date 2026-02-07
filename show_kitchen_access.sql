-- Show which resources kitchen role can access

SELECT 'Resources with VIEW permission:' as info,
       resource,
       can_view,
       can_edit,
       can_delete
FROM public.role_permissions
WHERE role = 'kitchen'
AND can_view = true;

-- Show all resources (to see what's missing)
SELECT 'All kitchen resources:' as info,
       resource,
       can_view,
       can_edit,
       can_delete
FROM public.role_permissions
WHERE role = 'kitchen'
ORDER BY resource;
