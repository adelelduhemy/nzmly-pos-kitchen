import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type AppRole = 'owner' | 'manager' | 'cashier' | 'kitchen' | 'inventory';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  warehouse_id: string | null;
}


export interface Permission {
  resource: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialLoadComplete = false;
    let lastSessionState: 'none' | 'active' | null = null;
    let fetchInProgress = false;

    async function handleAuthChange(session: Session | null) {
      if (!mounted) return;

      // Check fetch lock FIRST before any other logic
      if (fetchInProgress) return;

      // Determine current session state
      const currentSessionState = session ? 'active' : 'none';

      // Allow processing if:
      // 1. Initial load not complete yet, OR
      // 2. Session state changed (login/logout)
      const sessionStateChanged = lastSessionState !== null && lastSessionState !== currentSessionState;

      if (initialLoadComplete && !sessionStateChanged) return;

      if (sessionStateChanged) {
        initialLoadComplete = false;

        // Set loading=true immediately to prevent "Access Denied" flash
        if (currentSessionState === 'active') {
          setLoading(true);
        }
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchInProgress = true;
        const success = await fetchUserData(session.user.id);
        fetchInProgress = false;

        if (success) {
          initialLoadComplete = true;
          lastSessionState = 'active';
        } else {
          return;
        }
      } else {
        setProfile(null);
        setRoles([]);
        setPermissions([]);
        initialLoadComplete = true;
        lastSessionState = 'none';
      }

      if (mounted && initialLoadComplete) {
        setLoading(false);
      }
    }

    // Safety net: If loading is still true after 10 seconds, something is wrong
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 10000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignore SIGNED_IN events ONLY during initial load
        if (event === 'SIGNED_IN' && !initialLoadComplete) return;
        await handleAuthChange(session);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await handleAuthChange(session);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string): Promise<boolean> => {
    try {
      const profileQuery = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const profileTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout')), 8000)
      );

      const profileResult: any = await Promise.race([profileQuery, profileTimeout])
        .catch(() => ({ data: null, error: { message: 'Profile query timeout' }, status: 0, statusText: '', count: null }));

      const rolesQuery = supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      const rolesTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Roles query timeout')), 8000)
      );

      const rolesResult: any = await Promise.race([rolesQuery, rolesTimeout])
        .catch(() => ({ data: null, error: { message: 'Roles query timeout' }, status: 0, statusText: '', count: null }));

      // Check for network errors (status 0 = ERR_CONNECTION_CLOSED)
      if (profileResult.status === 0 || rolesResult.status === 0) {
        return false;
      }

      // Set profile
      if (profileResult.data) {
        setProfile(profileResult.data as UserProfile);
      }

      // Set roles and fetch permissions
      if (rolesResult.data) {
        const userRoles = rolesResult.data as UserRole[];
        setRoles(userRoles);

        // Fetch permissions for these roles
        if (userRoles.length > 0) {
          const roleNames = userRoles.map(r => r.role);
          const permResult = await supabase
            .from('role_permissions')
            .select('*')
            .in('role', roleNames);

          // Check for permission fetch network error
          if (permResult.status === 0) {
            return false;
          }

          const permData = permResult.data;

          if (permData) {
            // Merge permissions: if any role allows access, grant it
            const mergedPermissions: Record<string, Permission> = {};

            permData.forEach((p: any) => {
              if (!mergedPermissions[p.resource]) {
                mergedPermissions[p.resource] = {
                  resource: p.resource,
                  can_view: p.can_view,
                  can_edit: p.can_edit,
                  can_delete: p.can_delete
                };
              } else {
                // OR logic: if one role allows, allow it
                mergedPermissions[p.resource].can_view = mergedPermissions[p.resource].can_view || p.can_view;
                mergedPermissions[p.resource].can_edit = mergedPermissions[p.resource].can_edit || p.can_edit;
                mergedPermissions[p.resource].can_delete = mergedPermissions[p.resource].can_delete || p.can_delete;
              }
            });

            setPermissions(Object.values(mergedPermissions));
          }
        }
      }

      return true;
    } catch {
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setRoles([]);
      setPermissions([]);
    }
    return { error };
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.some(r => r.role === role);
  };

  const isOwner = (): boolean => {
    return roles.some(r => r.role === 'owner');
  };

  const isManager = (): boolean => {
    return roles.some(r => r.role === 'manager') && !isOwner();
  };

  const isOwnerOrManager = (): boolean => {
    return roles.some(r => r.role === 'owner' || r.role === 'manager');
  };

  const canManageInventory = (): boolean => {
    return roles.some(r => ['owner', 'manager', 'inventory'].includes(r.role));
  };

  // New Dynamic Permission Check
  const hasPermission = (resource: string): boolean => {
    // Owners always have full access
    if (hasRole('owner')) return true;

    // Check specific permission
    const perm = permissions.find(p => p.resource === resource);
    return perm ? perm.can_view : false;
  };

  return {
    user,
    session,
    profile,
    roles,
    permissions,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    isOwner,
    isManager,
    isOwnerOrManager,
    canManageInventory,
    hasPermission,
    isAuthenticated: !!session,
  };
}
