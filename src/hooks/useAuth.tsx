import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Get the appropriate redirect URL based on platform
 */
const getRedirectUrl = (): string => {
  if (Capacitor.isNativePlatform()) {
    // Native app: use custom URL scheme for deep linking
    return 'com.plexkhmerzoon://auth/callback';
  }
  // Web: use current origin
  return `${window.location.origin}/`;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Handle deep link for native OAuth callback
    let appUrlListener: any = null;
    
    if (Capacitor.isNativePlatform()) {
      App.addListener('appUrlOpen', async ({ url }) => {
        console.log('Deep link received:', url);
        
        // Handle OAuth callback
        if (url.includes('auth/callback')) {
          // Extract tokens from URL
          const urlObj = new URL(url.replace('com.plexkhmerzoon://', 'https://'));
          const accessToken = urlObj.searchParams.get('access_token') || urlObj.hash?.match(/access_token=([^&]*)/)?.[1];
          const refreshToken = urlObj.searchParams.get('refresh_token') || urlObj.hash?.match(/refresh_token=([^&]*)/)?.[1];

          if (accessToken && refreshToken) {
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error('Error setting session:', error);
              } else {
                console.log('Session set successfully');
                // Close the browser window
                await Browser.close();
              }
            } catch (e) {
              console.error('Error processing OAuth callback:', e);
            }
          }
        }
      }).then(listener => {
        appUrlListener = listener;
      });
    }

    return () => {
      subscription.unsubscribe();
      if (appUrlListener) {
        appUrlListener.remove();
      }
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = getRedirectUrl();
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const redirectUrl = getRedirectUrl();

    if (Capacitor.isNativePlatform()) {
      // Native: open OAuth URL in in-app browser
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // Don't redirect automatically
        },
      });

      if (error) {
        return { error };
      }

      if (data?.url) {
        // Open the OAuth URL in the in-app browser
        await Browser.open({ 
          url: data.url,
          windowName: '_self',
          presentationStyle: 'popover'
        });
      }

      return { error: null };
    }

    // Web: standard OAuth flow
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
