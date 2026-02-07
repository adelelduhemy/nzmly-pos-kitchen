-- Add unique constraint to prevent duplicate user_id+role combinations

-- First, clean up existing duplicates
WITH ranked_roles AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id, role ORDER BY created_at ASC) as rn
  FROM public.user_roles
)
DELETE FROM public.user_roles
WHERE id IN (
  SELECT id FROM ranked_roles WHERE rn > 1
);

-- Add unique constraint
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_role_unique 
UNIQUE (user_id, role);

-- Verify constraint was added
SELECT 'Constraint added:' as info,
       conname as constraint_name,
       contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.user_roles'::regclass
AND conname = 'user_roles_user_role_unique';
