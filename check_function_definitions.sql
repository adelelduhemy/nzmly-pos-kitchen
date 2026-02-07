-- Check the is_owner_or_manager function definition

SELECT 'is_owner_or_manager function:' as info,
       proname as function_name,
       pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'is_owner_or_manager'
AND pronamespace = 'public'::regnamespace;

-- Check the is_owner function too
SELECT 'is_owner function:' as info,
       proname as function_name,
       pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'is_owner'
AND pronamespace = 'public'::regnamespace;
