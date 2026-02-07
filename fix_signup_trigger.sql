-- Check if the trigger is actually attached to auth.users

-- 1. Check ALL triggers on auth.users
SELECT 'All triggers on auth.users:' as info,
       tgname as trigger_name,
       tgenabled as is_enabled,
       pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- 2. If trigger doesn't exist, create it
DO $$
BEGIN
  -- Check if trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    -- Create the trigger
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE 'Trigger created successfully';
  ELSE
    RAISE NOTICE 'Trigger already exists';
  END IF;
END $$;

-- 3. Verify trigger exists now
SELECT 'Trigger status:' as info,
       tgname as trigger_name,
       tgenabled as is_enabled,
       CASE tgenabled
         WHEN 'O' THEN 'Enabled'
         WHEN 'D' THEN 'Disabled'
         ELSE 'Unknown'
       END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created'
AND tgrelid = 'auth.users'::regclass;
