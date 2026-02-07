-- Grant kitchen role permission to view dashboard (needed for login)

UPDATE public.role_permissions
SET can_view = true,
    updated_at = NOW()
WHERE role = 'kitchen'
AND resource = 'dashboard';

-- Verify the update
SELECT 'Updated permissions:' as info,
       resource,
       can_view,
       can_edit,
       can_delete
FROM public.role_permissions
WHERE role = 'kitchen'
AND resource IN ('dashboard', 'kds')
ORDER BY resource;
