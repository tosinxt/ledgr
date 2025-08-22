/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType } from '../types';
import { supabase } from '@/lib/supabase';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session?.user) {
          const u = data.session.user;
          try {
            const { data: prof, error: profErr } = await supabase
              .from('profiles')
              .select('name, plan')
              .eq('id', u.id)
              .maybeSingle();
            if (profErr) throw profErr;
            const profile = {
              id: u.id,
              email: u.email || '',
              name: prof?.name || (u.user_metadata?.name as string) || '',
              plan: (prof?.plan as 'free' | 'pro') || 'free',
            } as User;
            if (mounted) setUser(profile);
          } catch (e) {
            console.error('Failed to load profile on init:', e);
            if (mounted) {
              const fallback = {
                id: u.id,
                email: u.email || '',
                name: (u.user_metadata?.name as string) || '',
                plan: 'free',
              } as User;
              setUser(fallback);
            }
          }
        } else if (mounted) {
          setUser(null);
        }
      } catch (e) {
        console.error('Auth init failed:', e);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const u = session.user;
          const { data: prof } = await supabase
            .from('profiles')
            .select('name, plan')
            .eq('id', u.id)
            .maybeSingle();
          const profile = {
            id: u.id,
            email: u.email || '',
            name: prof?.name || (u.user_metadata?.name as string) || '',
            plan: (prof?.plan as 'free' | 'pro') || 'free',
          } as User;
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Auth state change handling failed:', e);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const u = data.user;
      const profile: User = { id: u.id, email: u.email || email, name: (u.user_metadata?.name as string) || email.split('@')[0], plan: 'free' };
      setUser(profile);
    } catch (e) {
      throw e instanceof Error ? e : new Error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      const u = data.user;
      if (!u) return; // email confirmation may be required
      // Create or update profile row (RLS allows upserting own id)
      await supabase.from('profiles').upsert({ id: u.id, name, plan: 'free' });
      const profile: User = { id: u.id, email: u.email || email, name, plan: 'free' };
      setUser(profile);
    } catch (e) {
      throw e instanceof Error ? e : new Error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    void supabase.auth.signOut();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};