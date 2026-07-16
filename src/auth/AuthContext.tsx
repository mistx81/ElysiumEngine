import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase-client';
import { UserRole } from '../engine/types';

export interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  settings: any;
  created_at: string | null;
  role: UserRole;
  banned: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,display_name,avatar_url,bio,settings,role,banned,created_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then((p) => setProfile(p));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        (async () => {
          const existing = await fetchProfile(newSession.user.id);
          if (!existing) {
            await supabase.from('profiles').insert({
              id: newSession.user.id,
              email: newSession.user.email,
              role: 'user',
            });
            const created = await fetchProfile(newSession.user.id);
            setProfile(created);
          } else {
            setProfile(existing);
          }
        })();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        display_name: displayName ?? null,
        role: 'user',
        banned: false,
      });
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) throw error;
    await refreshProfile();
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
  };

  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin';
  const isStaff =
    profile?.role === 'owner' ||
    profile?.role === 'admin' ||
    profile?.role === 'moderator';

  const value: AuthContextType = {
    user,
    session,
    loading,
    profile,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    isAdmin,
    isStaff,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
