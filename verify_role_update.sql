-- Check if adel's role was actually updated in the database

SELECT 'Adel current roles:' as info,
       id,
       user_id,
       role,
       created_at
FROM public.user_roles
WHERE user_id = '7164c2c5-aaf1-4c77-94c7-7db48d6f2efa'
ORDER BY created_at DESC;

-- Count total roles
SELECT 'Total count:' as info,
       COUNT(*) as total_roles
FROM public.user_roles
WHERE user_id = '7164c2c5-aaf1-4c77-94c7-7db48d6f2efa';
