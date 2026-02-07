-- FIX: Assign 'owner' role to your user (Corrected for missing constraint)
-- Run this in Supabase SQL Editor

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::public.app_role
FROM auth.users
WHERE email = 'adel.elduhemy@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.users.id 
    AND ur.role = 'owner'
);

-- Verify it worked
SELECT u.email, ur.role 
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'adel.elduhemy@gmail.com';
