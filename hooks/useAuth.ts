import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [newUserProfile, setNewUserProfile] = useState<{ username: string; display_name: string } | null>(null);

  // Ensure profile exists for user
  const ensureProfile = async (user: User): Promise<{ username: string; display_name: string } | null> => {
    try {
      // Check if profile exists with a timeout
      const profileCheck = supabase
        .from('profiles')
        .select('user_id, username, display_name')
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
        let username = user.user_metadata?.name ||
                        user.user_metadata?.full_name ||
                        user.email?.split('@')[0] ||
                        'User';

        // If username conflicts, append a unique identifier
        let attempt = 0;
        let insertError = null;

        while (attempt < 5) {
          const usernameToTry = attempt === 0 ? username : `${username}_${user.id.slice(0, 4)}`;

          const { error } = await supabase.from('profiles').insert({
            user_id: user.id,
            username: usernameToTry,
            display_name: username, // Keep display_name as the clean version
          });

          if (!error) {
            // Success! Mark as new user to trigger welcome modal
            const profile = { username: usernameToTry, display_name: username };
            setNewUserProfile(profile);
            setIsNewUser(true);
            return profile;
          }

          // If it's a duplicate key error, try with modified username
          if (error.code === '23505') {
            attempt++;
            insertError = error;
            continue;
          }

          // If it's a different error, log and return null
          console.error('Error inserting profile:', error);
          return null;
        }

        console.error('Failed to insert profile after multiple attempts:', insertError);
        return null;
      }

      return existingProfile;
    } catch (error) {
      console.error('Error ensuring profile:', error);
      // Don't block auth if profile check fails
      return null;
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
    // Dynamically determine redirect URL based on environment
    const redirectUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000/billboard-trivia/'
      : 'https://alexandersimoes.github.io/billboard-trivia/';

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

  const dismissNewUserModal = () => {
    setIsNewUser(false);
    setNewUserProfile(null);
  };

  return {
    user,
    loading,
    isNewUser,
    newUserProfile,
    signInWithGoogle,
    signOut,
    dismissNewUserModal,
  };
}
