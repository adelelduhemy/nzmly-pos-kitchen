-- Fix: Use existing parameter names to avoid DROP CASCADE

-- Fix is_owner function (parameter name: user_id_param)
CREATE OR REPLACE FUNCTION public.is_owner(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = user_id_param
    AND role = 'owner'
  );
$$;

-- Fix is_owner_or_manager function (parameter name: _user_id)
CREATE OR REPLACE FUNCTION public.is_owner_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('owner', 'manager')
  );
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner_or_manager(UUID) TO authenticated;

-- Verify changes
SELECT 'Updated functions:' as result,
       proname,
       prosecdef as security_definer,
       prolang::regtype as language,
       provolatile as volatility
FROM pg_proc
WHERE proname IN ('is_owner', 'is_owner_or_manager')
ORDER BY proname;
