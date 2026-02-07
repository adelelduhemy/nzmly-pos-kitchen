-- Fix duplicate owner roles for adel.elduhemy@gmail.com

-- Step 1: View all duplicate entries
SELECT 'Current duplicate entries:' as info,
       id,
       user_id,
       role,
       created_at
FROM public.user_roles
WHERE user_id = '7164c2c5-aaf1-4c77-94c7-7db48d6f2efa'
AND role = 'owner'
ORDER BY created_at;

-- Step 2: Delete duplicates, keeping only the oldest one
WITH ranked_roles AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id, role ORDER BY created_at ASC) as rn
  FROM public.user_roles
  WHERE user_id = '7164c2c5-aaf1-4c77-94c7-7db48d6f2efa'
  AND role = 'owner'
)
DELETE FROM public.user_roles
WHERE id IN (
  SELECT id FROM ranked_roles WHERE rn > 1
);

-- Step 3: Verify only one owner role remains
SELECT 'After cleanup:' as info,
       id,
       user_id,
       role,
       created_at
FROM public.user_roles
WHERE user_id = '7164c2c5-aaf1-4c77-94c7-7db48d6f2efa';
