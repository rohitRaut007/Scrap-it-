import AsyncStorage from "@react-native-async-storage/async-storage";
import { authDebugLog, summarizeAccessToken } from "@/lib/auth-debug";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { supabase } from "@/lib/supabase";

export interface AuthResult {
  userId: string;
  email: string;
  /** Use for the next API call right after sign-in; `getSession()` can lag behind AsyncStorage. */
  accessToken: string | null;
}

function mapAuthError(
  error: { message?: string; code?: string; status?: number } | null,
): Error | null {
  if (!error) return null;
  if (error.code === "email_not_confirmed") {
    return new Error(
      "Confirm your email before signing in. Check your inbox for the Supabase link, or turn off “Confirm email” in Supabase → Authentication → Providers → Email (dev only).",
    );
  }
  const msg = error.message ?? "Authentication failed";
  if (/email.*confirm|not.*confirmed/i.test(msg)) {
    return new Error(
      "Confirm your email before signing in. Check your inbox, or adjust Supabase email confirmation settings for development.",
    );
  }
  return new Error(msg);
}

export const authService = {
  async getOnboardingComplete(): Promise<boolean> {
    const v = await AsyncStorage.getItem(STORAGE_KEYS.onboardingComplete);
    return v === "1";
  },

  async completeOnboarding(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.onboardingComplete, "1");
  },

  async getSession(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },

  async getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    const mapped = mapAuthError(error);
    if (mapped) throw mapped;
    if (!data.user) throw new Error("Sign-in returned no user");
    const accessToken = data.session?.access_token ?? null;
    if (__DEV__) {
      authDebugLog("signInWithPassword ok", {
        userId: data.user.id,
        sessionPresent: !!data.session,
        tokenSummary: summarizeAccessToken(accessToken),
      });
    }
    return {
      userId: data.user.id,
      email: data.user.email ?? email,
      accessToken,
    };
  },

  async signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    const mapped = mapAuthError(error);
    if (mapped) throw mapped;
    if (!data.user) throw new Error("Sign-up returned no user");
    const accessToken = data.session?.access_token ?? null;
    if (__DEV__) {
      authDebugLog("signUp ok", {
        userId: data.user.id,
        sessionPresent: !!data.session,
        tokenSummary: summarizeAccessToken(accessToken),
      });
    }
    return {
      userId: data.user.id,
      email: data.user.email ?? email,
      accessToken,
    };
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },
};
