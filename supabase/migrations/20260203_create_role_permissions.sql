-- Create role_permissions table for Dynamic RBAC
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.app_role NOT NULL,
  resource TEXT NOT NULL, -- e.g. 'pos', 'reports', 'inventory'
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, resource)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for permissions" 
  ON public.role_permissions FOR SELECT 
  USING (true); -- Simplified for now so useAuth can fetch easily

CREATE POLICY "Only owners can manage permissions" 
  ON public.role_permissions FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- Helper function to initialize default permissions (prevent lockout)
CREATE OR REPLACE FUNCTION initialize_default_permissions()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  r public.app_role;
  resources TEXT[] := ARRAY['dashboard', 'pos', 'orders', 'kds', 'menu', 'tables', 'inventory', 'reports', 'settings', 'users', 'finance', 'crm', 'suppliers'];
  res TEXT;
BEGIN
  -- 1. OWNER: Full Access
  FOREACH res IN ARRAY resources LOOP
    INSERT INTO public.role_permissions (role, resource, can_view, can_edit, can_delete)
    VALUES ('owner', res, true, true, true)
    ON CONFLICT (role, resource) DO NOTHING;
  END LOOP;

  -- 2. MANAGER: Most Access
  FOREACH res IN ARRAY resources LOOP
    IF res IN ('settings', 'finance') THEN
      INSERT INTO public.role_permissions (role, resource, can_view, can_edit, can_delete)
      VALUES ('manager', res, false, false, false)
      ON CONFLICT (role, resource) DO NOTHING;
    ELSE
      INSERT INTO public.role_permissions (role, resource, can_view, can_edit, can_delete)
      VALUES ('manager', res, true, true, false)
      ON CONFLICT (role, resource) DO NOTHING;
    END IF;
  END LOOP;

  -- 3. CASHIER: Front of House
  FOREACH res IN ARRAY resources LOOP
    IF res IN ('dashboard', 'pos', 'orders', 'tables') THEN
      INSERT INTO public.role_permissions (role, resource, can_view, can_edit, can_delete)
      VALUES ('cashier', res, true, true, false)
      ON CONFLICT (role, resource) DO NOTHING;
    ELSE
      INSERT INTO public.role_permissions (role, resource, can_view, can_edit, can_delete)
      VALUES ('cashier', res, false, false, false)
      ON CONFLICT (role, resource) DO NOTHING;
    END IF;
  END LOOP;

  -- 4. KITCHEN: KDS Only
  FOREACH res IN ARRAY resources LOOP
    IF res = 'kds' THEN
       INSERT INTO public.role_permissions (role, resource, can_view, can_edit, can_delete)
       VALUES ('kitchen', res, true, true, false)
       ON CONFLICT (role, resource) DO NOTHING;
    ELSE
       INSERT INTO public.role_permissions (role, resource, can_view, can_edit, can_delete)
       VALUES ('kitchen', res, false, false, false)
       ON CONFLICT (role, resource) DO NOTHING;
    END IF;
  END LOOP;
  
   -- 5. INVENTORY: Stock Mgmt
  FOREACH res IN ARRAY resources LOOP
    IF res IN ('inventory', 'suppliers') THEN
       INSERT INTO public.role_permissions (role, resource, can_view, can_edit, can_delete)
       VALUES ('inventory', res, true, true, true)
       ON CONFLICT (role, resource) DO NOTHING;
    ELSE
       INSERT INTO public.role_permissions (role, resource, can_view, can_edit, can_delete)
       VALUES ('inventory', res, false, false, false)
       ON CONFLICT (role, resource) DO NOTHING;
    END IF;
  END LOOP;

END;
$$;

-- Run initialization
SELECT initialize_default_permissions();
