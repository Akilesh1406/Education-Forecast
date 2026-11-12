import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null }; error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    department: string,
    semester: number
  ) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInAsDemo: (demoRole: UserRole) => void;
  resendConfirmationEmail: (email: string) => Promise<{ data: unknown; error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ACCOUNTS: Record<UserRole, { user: User; profile: UserProfile }> = {
  student: {
    user: {
      id: 'demo-student-uuid-001',
      app_metadata: {},
      user_metadata: { name: 'Priya Patel', role: 'student' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'priya.patel@college.edu',
    } as unknown as User,
    profile: {
      id: 'demo-student-uuid-001',
      user_id: 'demo-student-uuid-001',
      name: 'Priya Patel',
      email: 'priya.patel@college.edu',
      department: 'Artificial Intelligence & Data Science',
      semester: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  faculty: {
    user: {
      id: 'demo-faculty-uuid-002',
      app_metadata: {},
      user_metadata: { name: 'Dr. Rajesh Kumar', role: 'faculty' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'rajesh.kumar@college.edu',
    } as unknown as User,
    profile: {
      id: 'demo-faculty-uuid-002',
      user_id: 'demo-faculty-uuid-002',
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@college.edu',
      department: 'Artificial Intelligence & Data Science',
      semester: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  admin: {
    user: {
      id: 'demo-admin-uuid-003',
      app_metadata: {},
      user_metadata: { name: 'System Administrator', role: 'admin' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'admin.office@college.edu',
    } as unknown as User,
    profile: {
      id: 'demo-admin-uuid-003',
      user_id: 'demo-admin-uuid-003',
      name: 'System Administrator',
      email: 'admin.office@college.edu',
      department: 'Administration',
      semester: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (authUser: User) => {
    try {
      // 1. Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle();

      let currentRole: UserRole = 'student';
      if (!roleError && roleData?.role) {
        currentRole = roleData.role as UserRole;
      } else if (authUser.user_metadata?.role) {
        currentRole = authUser.user_metadata.role as UserRole;
      } else if (authUser.email?.includes('admin')) {
        currentRole = 'admin';
      }
      setRole(currentRole);

      // 2. Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as unknown as UserProfile);
      } else {
        setProfile({
          id: authUser.id,
          user_id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          semester: authUser.user_metadata?.semester || 1,
          department: authUser.user_metadata?.department || 'Artificial Intelligence & Data Science',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Failed to fetch user profile/role:', err);
      setRole((authUser.user_metadata?.role as UserRole) || 'student');
      setProfile({
        id: authUser.id,
        user_id: authUser.id,
        name: authUser.user_metadata?.name || 'User',
        email: authUser.email || '',
        semester: authUser.user_metadata?.semester || 1,
        department: authUser.user_metadata?.department || 'Artificial Intelligence & Data Science',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    // Check if demo user is active in localStorage
    const savedDemoRole = localStorage.getItem('demo_role') as UserRole | null;
    if (savedDemoRole && DEMO_ACCOUNTS[savedDemoRole]) {
      const demoData = DEMO_ACCOUNTS[savedDemoRole];
      setUser(demoData.user);
      setProfile(demoData.profile);
      setRole(savedDemoRole);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchUserData(currentUser).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        // If demo user is logged in, don't overwrite with null supabase session
        if (localStorage.getItem('demo_role')) return;

        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchUserData(currentUser);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  const signIn = async (email: string, password: string) => {
    localStorage.removeItem('demo_role');
    const response = await supabase.auth.signInWithPassword({ email, password });
    if (response.data.user) {
      await fetchUserData(response.data.user);
    }
    return response;
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    requestedRole: UserRole,
    department: string,
    semester: number
  ) => {
    localStorage.removeItem('demo_role');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name,
          role: requestedRole,
          department,
          semester,
        },
      },
    });

    if (error) return { error };

    if (data.user) {
      try {
        await supabase.from('user_roles').insert([
          {
            user_id: data.user.id,
            role: requestedRole,
          },
        ]);
      } catch (insertError) {
        console.warn('Could not insert into user_roles directly:', insertError);
      }

      try {
        await supabase.from('profiles').insert([
          {
            user_id: data.user.id,
            name,
            email,
            department,
            semester,
          },
        ]);
      } catch (profileErr) {
        console.warn('Profile creation note:', profileErr);
      }
    }

    return { error: null };
  };

  const signInAsDemo = (demoRole: UserRole) => {
    const demo = DEMO_ACCOUNTS[demoRole];
    localStorage.setItem('demo_role', demoRole);
    setUser(demo.user);
    setProfile(demo.profile);
    setRole(demoRole);
    setLoading(false);
  };

  const resendConfirmationEmail = async (email: string) => {
    return await supabase.auth.resend({
      type: 'signup',
      email,
    });
  };

  const signOut = async () => {
    localStorage.removeItem('demo_role');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        signInAsDemo,
        resendConfirmationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuth = useAuthContext;
