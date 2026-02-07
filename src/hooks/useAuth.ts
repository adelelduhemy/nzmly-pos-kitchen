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
    let lastSessionState: 'none' | 'active' | null = null; // Track session state changes
    let fetchInProgress = false; // CRITICAL: Prevent concurrent fetches
    console.log('🔐 useAuth: Effect started');

    async function handleAuthChange(session: Session | null) {
      if (!mounted) {
        console.log('🔐 useAuth: Component unmounted, skipping');
        return;
      }

      // CRITICAL: Check fetch lock FIRST before any other logic
      if (fetchInProgress) {
        console.warn('🔐 useAuth: Fetch already in progress, skipping duplicate call');
        return;
      }

      // Determine current session state
      const currentSessionState = session ? 'active' : 'none';

      // Allow processing if:
      // 1. Initial load not complete yet, OR
      // 2. Session state changed (login/logout)
      const sessionStateChanged = lastSessionState !== null && lastSessionState !== currentSessionState;

      if (initialLoadComplete && !sessionStateChanged) {
        console.log('🔐 useAuth: Initial load already complete and no session change, skipping duplicate call');
        return;
      }

      if (sessionStateChanged) {
        console.log(`🔐 useAuth: Session state changed from ${lastSessionState} to ${currentSessionState}`);
        initialLoadComplete = false; // Reset to allow reloading user data

        // CRITICAL: Set loading=true immediately to prevent "Access Denied" flash
        // This ensures Router waits for permissions to load before checking access
        if (currentSessionState === 'active') {
          console.log('🔐 useAuth: New login detected, setting loading to TRUE');
          setLoading(true);
        }
      }

      console.log('🔐 useAuth: handleAuthChange called', { hasSession: !!session, userId: session?.user?.id });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('🔐 useAuth: Fetching user data for', session.user.id);
        fetchInProgress = true; // Mark fetch as in progress
        const success = await fetchUserData(session.user.id);
        fetchInProgress = false; // Mark fetch as complete

        if (success) {
          console.log('🔐 useAuth: User data fetched successfully');
          initialLoadComplete = true;
          lastSessionState = 'active';
        } else {
          console.warn('🔐 useAuth: User data fetch failed, will retry on next auth event');
          return;
        }
      } else {
        console.log('🔐 useAuth: No session, clearing user data');
        setProfile(null);
        setRoles([]);
        setPermissions([]);
        initialLoadComplete = true;
        lastSessionState = 'none';
      }

      if (mounted && initialLoadComplete) {
        console.log('🔐 useAuth: Setting loading to FALSE');
        setLoading(false);
      }
    }

    // Safety net: If loading is still true after 10 seconds, something is wrong
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.error('🔐 useAuth: SAFETY TIMEOUT - Database queries taking too long (>10s)');
        console.error('🔐 useAuth: Check your internet connection and Supabase status');
        setLoading(false); // Prevent infinite loading
      }
    }, 10000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 useAuth: Auth state changed', event);

        // CRITICAL: Ignore SIGNED_IN events ONLY during initial load
        // SIGNED_IN fires before Supabase is fully initialized, causing timeouts
        // But after initial load, SIGNED_IN means the user actually logged in!
        if (event === 'SIGNED_IN' && !initialLoadComplete) {
          console.log('🔐 useAuth: Ignoring SIGNED_IN during initial load, waiting for INITIAL_SESSION');
          return;
        }

        await handleAuthChange(session);
      }
    );

    // Get initial session
    console.log('🔐 useAuth: Getting initial session');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('🔐 useAuth: Initial session retrieved', { hasSession: !!session });
      await handleAuthChange(session);
    });

    return () => {
      console.log('🔐 useAuth: Cleanup');
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string): Promise<boolean> => {
    console.log('🔐 fetchUserData: Starting for userId:', userId);

    try {
      console.log('🔐 fetchUserData: Fetching profile and roles...');

      // Query them sequentially with timeout to see which one hangs
      console.log('🔐 fetchUserData: Step 1 - Querying profiles table...');
      const profileQueryStart = Date.now();

      const profileQuery = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const profileTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => {
          console.error('🔐 fetchUserData: PROFILE QUERY TIMEOUT after 8 seconds!');
          reject(new Error('Profile query timeout'));
        }, 8000)
      );

      const profileResult: any = await Promise.race([profileQuery, profileTimeout])
        .catch(err => {
          console.error('🔐 fetchUserData: Profile query error:', err.message);
          return { data: null, error: err, status: 0, statusText: '', count: null };
        });

      const profileQueryTime = Date.now() - profileQueryStart;
      console.log(`🔐 fetchUserData: Profile query completed in ${profileQueryTime}ms`);

      console.log('🔐 fetchUserData: Step 2 - Querying user_roles table...');
      const rolesQueryStart = Date.now();

      const rolesQuery = supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      const rolesTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => {
          console.error('🔐 fetchUserData: ROLES QUERY TIMEOUT after 8 seconds!');
          reject(new Error('Roles query timeout'));
        }, 8000)
      );

      const rolesResult: any = await Promise.race([rolesQuery, rolesTimeout])
        .catch(err => {
          console.error('🔐 fetchUserData: Roles query error:', err.message);
          return { data: null, error: err, status: 0, statusText: '', count: null };
        });

      const rolesQueryTime = Date.now() - rolesQueryStart;
      console.log(`🔐 fetchUserData: Roles query completed in ${rolesQueryTime}ms`);

      console.log('🔐 fetchUserData: Profile result:', profileResult);
      if (profileResult.error) {
        console.error('🔐 fetchUserData: Profile error details:', {
          message: profileResult.error.message,
          code: profileResult.error.code,
          details: profileResult.error.details,
          hint: profileResult.error.hint
        });
      }

      console.log('🔐 fetchUserData: Roles result:', rolesResult);
      if (rolesResult.error) {
        console.error('🔐 fetchUserData: Roles error details:', {
          message: rolesResult.error.message,
          code: rolesResult.error.code,
          details: rolesResult.error.details,
          hint: rolesResult.error.hint
        });
      }

      // Check for network errors (status 0 = ERR_CONNECTION_CLOSED)
      if (profileResult.status === 0 || rolesResult.status === 0) {
        console.error('🔐 fetchUserData: Network error detected, aborting this attempt');
        return false; // Signal failure, will retry on next auth event
      }

      // Set profile
      if (profileResult.data) {
        console.log('🔐 fetchUserData: Setting profile');
        setProfile(profileResult.data as UserProfile);
      } else {
        console.warn('🔐 fetchUserData: No profile found!');
      }

      // Set roles and fetch permissions
      if (rolesResult.data) {
        const userRoles = rolesResult.data as UserRole[];
        console.log('🔐 fetchUserData: Setting roles:', userRoles);
        setRoles(userRoles);

        // Fetch permissions for these roles
        if (userRoles.length > 0) {
          const roleNames = userRoles.map(r => r.role);
          console.log('🔐 fetchUserData: Fetching permissions for roles:', roleNames);
          const permResult = await supabase
            .from('role_permissions')
            .select('*')
            .in('role', roleNames);

          console.log('🔐 fetchUserData: Permissions result:', permResult);

          // Check for permission fetch network error
          if (permResult.status === 0) {
            console.error('🔐 fetchUserData: Network error fetching permissions, aborting');
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

            console.log('🔐 fetchUserData: Setting merged permissions:', mergedPermissions);
            setPermissions(Object.values(mergedPermissions));
          }
        } else {
          console.warn('🔐 fetchUserData: User has NO roles!');
        }
      } else {
        console.warn('🔐 fetchUserData: No roles found for user!');
      }

      console.log('🔐 fetchUserData: Completed successfully');
      return true; // Success!
    } catch (error) {
      console.error('🔐 fetchUserData: ERROR occurred:', error);
      return false; // Signal failure
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
