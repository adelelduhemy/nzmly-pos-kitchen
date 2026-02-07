-- Create missing profile with email for kitchen user

INSERT INTO public.profiles (user_id, name, email, created_at, updated_at)
VALUES (
  'be55c5ac-9cf6-41e0-afb9-b85aada17e6d',
  'Kitchen User',
  'l.elduhemy@gmail.com',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Verify profile was created
SELECT 'Profile created:' as info,
       user_id,
       name,
       email,
       created_at
FROM public.profiles
WHERE user_id = 'be55c5ac-9cf6-41e0-afb9-b85aada17e6d';
