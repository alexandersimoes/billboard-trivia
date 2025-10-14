import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Ensure profile exists for user
  const ensureProfile = async (user: User) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        // Create profile with username from Google metadata
        const username = user.user_metadata?.name ||
                        user.user_metadata?.full_name ||
                        user.email?.split('@')[0] ||
                        'User';

        await supabase.from('profiles').insert({
          user_id: user.id,
          username: username,
        });
      }
    } catch (error) {
      console.error('Error ensuring profile:', error);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        ensureProfile(session.user);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await ensureProfile(session.user);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = 'https://alexandersimoes.github.io/billboard-trivia/';

    console.log('Signing in with redirect URL:', redirectUrl);
    console.log('Current location:', window.location.href);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    if (error) {
      console.error('Google sign-in error:', error);
    } else {
      console.log('OAuth initiated successfully');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };
}
