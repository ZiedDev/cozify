import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";

import { syncEngine } from "../db/sync-engine";
import { cacheManager } from "../db/cache-layer";

import { supabase, isSupabaseConfigured } from "./client";
import { supabaseProvider } from "./provider";

export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithOAuth: (
    provider: "google" | "discord" | "github",
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<UserProfile>,
  ) => Promise<{ error: Error | null }>;
  syncNow: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const configured = isSupabaseConfigured();

  const fetchProfile = useCallback(async (currentUser: User) => {
    if (!supabase) return;
    try {
      const oauthAvatar =
        currentUser.user_metadata?.avatar_url ||
        currentUser.user_metadata?.picture ||
        currentUser.user_metadata?.avatar;
      const oauthName =
        currentUser.user_metadata?.custom_claims?.global_name ||
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.user_metadata?.user_name ||
        currentUser.email?.split("@")[0];

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (data) {
        // If the active OAuth provider has an avatar and it differs, refresh it
        const updatedAvatar = oauthAvatar || data.avatar_url;
        const updatedDisplayName = data.display_name || oauthName;

        if (oauthAvatar && oauthAvatar !== data.avatar_url) {
          await supabase
            .from("profiles")
            .update({
              avatar_url: updatedAvatar,
              updated_at: Date.now(),
            })
            .eq("id", currentUser.id);
        }

        setProfile({
          id: data.id,
          email: data.email || currentUser.email,
          displayName: updatedDisplayName,
          avatarUrl: updatedAvatar,
        });
      } else {
        // Create initial profile row with current OAuth metadata
        const newProfile = {
          id: currentUser.id,
          email: currentUser.email,
          display_name: oauthName || "Cozify Member",
          avatar_url: oauthAvatar || null,
          created_at: Date.now(),
          updated_at: Date.now(),
        };

        await supabase.from("profiles").upsert(newProfile);

        setProfile({
          id: currentUser.id,
          email: currentUser.email,
          displayName: newProfile.display_name,
          avatarUrl: newProfile.avatar_url || undefined,
        });
      }
    } catch {
      // Fallback directly to user_metadata if profiles query fails
      const oauthAvatar =
        currentUser.user_metadata?.avatar_url ||
        currentUser.user_metadata?.picture;
      const oauthName =
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.email?.split("@")[0];

      setProfile({
        id: currentUser.id,
        email: currentUser.email,
        displayName: oauthName || "Cozify Member",
        avatarUrl: oauthAvatar,
      });
    }
  }, []);

  useEffect(() => {
    if (!configured || !supabase) {
      setIsLoading(false);

      return;
    }

    // 1. Initial session check
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          syncEngine.registerProvider(supabaseProvider);
          try {
            await Promise.allSettled([
              fetchProfile(initialSession.user),
              syncEngine.syncWithRemote(),
            ]);
          } catch {
            // Ignore network errors on initial sync
          }
        }
        setIsLoading(false);
      });

    // 2. Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        syncEngine.registerProvider(supabaseProvider);
        if (event === "SIGNED_IN") {
          fetchProfile(newSession.user);
          // Run background remote sync quietly without resetting UI loading state
          syncEngine.syncWithRemote();
        } else if (event === "USER_UPDATED") {
          fetchProfile(newSession.user);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured, fetchProfile]);

  const signInWithOAuth = async (provider: "google" | "discord" | "github") => {
    if (!supabase) return { error: new Error("Supabase is not configured") };
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        },
      });

      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore network errors on sign out
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      syncEngine.resetEngine();
      await cacheManager.clearAllClientData();
      if (typeof window !== "undefined" && window.history) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!supabase || !user) {
      return { error: new Error("User not authenticated") };
    }
    try {
      const payload: any = { updated_at: Date.now() };

      if (updates.displayName !== undefined)
        payload.display_name = updates.displayName;
      if (updates.avatarUrl !== undefined)
        payload.avatar_url = updates.avatarUrl;

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);

      if (!error) {
        setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      }

      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const syncNow = async () => {
    return await syncEngine.syncWithRemote();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: configured,
        signInWithOAuth,
        signOut,
        updateProfile,
        syncNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
