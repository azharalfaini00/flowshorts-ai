import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type UserStatus = 'pending' | 'approved' | 'admin' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  status: UserStatus;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<UserStatus>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Email admin otomatis (dari env atau hardcoded dari user)
  const ADMIN_EMAIL = 'alfainialfa1@gmail.com';

  const fetchUserStatus = async (currentUser: User) => {
    try {
      // 1. Cek apakah user ada di database
      let { data, error } = await supabase
        .from('users')
        .select('status')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // 2. Jika belum ada (PGRST116: row not found), insert baru
        const initialStatus = currentUser.email === ADMIN_EMAIL ? 'admin' : 'pending';
        
        const { data: newData, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: currentUser.id,
              email: currentUser.email,
              status: initialStatus,
            },
          ])
          .select('status')
          .single();

        if (insertError) {
          console.error('Error inserting new user:', insertError);
          setStatus('pending'); // Fallback
        } else if (newData) {
          setStatus(newData.status as UserStatus);
        }
      } else if (data) {
        setStatus(data.status as UserStatus);
      }
    } catch (err) {
      console.error('Error fetching user status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserStatus(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserStatus(session.user);
      } else {
        setStatus(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Error logging in:', error.message);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error.message);
  };

  return (
    <AuthContext.Provider value={{ session, user, status, isLoading, signOut, signInWithGoogle }}>
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
