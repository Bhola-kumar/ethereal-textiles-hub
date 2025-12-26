import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  isSeller: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const mountedRef = useRef(true);
  const rolesReqIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchUserRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;

      const userRoles = (data ?? []).map((r) => r.role) as AppRole[];
      if (mountedRef.current) setRoles(userRoles);
      return userRoles;
    } catch {
      if (mountedRef.current) setRoles([]);
      return [];
    }
  }, []);

  const startRoleFetch = useCallback(
    (userId: string) => {
      rolesReqIdRef.current += 1;
      const reqId = rolesReqIdRef.current;
      setRolesLoading(true);

      setTimeout(async () => {
        const fetched = await fetchUserRoles(userId);
        if (!mountedRef.current) return;
        if (reqId !== rolesReqIdRef.current) return;

        // If user has no explicit roles, keep as customer by default.
        setRoles(fetched);
        setRolesLoading(false);
      }, 0);
    },
    [fetchUserRoles]
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Synchronous only (avoid deadlocks)
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setRoles([]);
        setRolesLoading(false);
        setAuthInitialized(true);
      } else {
        setAuthInitialized(true);
        startRoleFetch(nextSession.user.id);
      }
    });

    (async () => {
      try {
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        setAuthInitialized(true);

        if (!existingSession?.user) {
          setRoles([]);
          setRolesLoading(false);
        } else {
          startRoleFetch(existingSession.user.id);
        }
      } catch {
        if (!mountedRef.current) return;
        setSession(null);
        setUser(null);
        setRoles([]);
        setRolesLoading(false);
        setAuthInitialized(true);
      }
    })();

    return () => subscription.unsubscribe();
  }, [startRoleFetch]);

  const loading = !authInitialized || rolesLoading;

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const isAdmin = roles.includes('admin');
  const isSeller = roles.includes('seller');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roles,
        isAdmin,
        isSeller,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

