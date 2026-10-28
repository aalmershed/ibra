import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Profile } from './types';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/** يترجم أشهر رسائل الخطأ من Supabase للعربي */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'البريد أو كلمة المرور غير صحيحة.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'هذا البريد مسجّل من قبل. جرّب تسجيل الدخول.';
  if (m.includes('email not confirmed')) return 'فعّل حسابك من الرسالة اللي وصلت بريدك أولاً.';
  if (m.includes('password should be')) return 'كلمة المرور لازم تكون ٦ أحرف أو أكثر.';
  if (m.includes('invalid email') || m.includes('unable to validate email')) return 'صيغة البريد الإلكتروني غير صحيحة.';
  if (m.includes('network') || m.includes('fetch')) return 'تأكد من اتصالك بالإنترنت وحاول مرة ثانية.';
  if (m.includes('rate limit')) return 'محاولات كثيرة. انتظر شوي وحاول مرة ثانية.';
  return 'صار خطأ غير متوقع. حاول مرة ثانية.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('id, full_name, role').eq('id', userId).maybeSingle();
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // نؤجل الطلب عشان ما يتعارض مع حدث تسجيل الدخول نفسه
      setTimeout(() => loadProfile(s?.user.id), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      isAdmin: profile?.role === 'admin',
      ready,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new Error(authErrorMessage(error.message));
      },
      signUp: async (fullName, email, password) => {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw new Error(authErrorMessage(error.message));
        return { needsConfirmation: !data.session };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      refreshProfile: () => loadProfile(session?.user.id),
    }),
    [session, profile, ready, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
