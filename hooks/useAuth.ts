import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Ensure profile exists for user
  const ensureProfile = async (user: User) => {
    try {
      // Check if profile exists with a timeout
      const profileCheck = supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      const { data: existingProfile } = await Promise.race([
        profileCheck,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile check timeout')), 2000)
        )
      ]) as any;

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
      // Don't block auth if profile check fails
    }
  };

  useEffect(() => {
    let mounted = true;

    // Timeout fallback - if auth doesn't respond in 3 seconds, stop loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 3000);

    // Listen for changes on auth state (this fires immediately with current session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      clearTimeout(timeoutId);

      // Set user and stop loading immediately
      setUser(session?.user ?? null);
      setLoading(false);

      // Ensure profile exists in background (don't block UI)
      if (session?.user) {
        ensureProfile(session.user);
      }
    });

    // Also try getSession as a backup (but don't wait for it)
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        clearTimeout(timeoutId);

        // Set user and stop loading immediately
        setUser(session?.user ?? null);
        setLoading(false);

        // Ensure profile exists in background
        if (session?.user) {
          ensureProfile(session.user);
        }
      })
      .catch((error) => {
        console.error('getSession error:', error);
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
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
