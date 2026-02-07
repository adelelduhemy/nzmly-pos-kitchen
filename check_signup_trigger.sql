-- Check if there's a trigger to auto-create profiles on signup

SELECT 'Triggers on auth.users:' as info,
       tgname as trigger_name,
       pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- Check if there's a function to handle new user signup
SELECT 'handle_new_user function:' as info,
       proname as function_name,
       pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname LIKE '%new_user%'
OR proname LIKE '%profile%'
AND pronamespace = 'public'::regnamespace;
