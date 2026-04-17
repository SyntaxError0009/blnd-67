import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  username: string | null;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      if (!s) {
        setIsAdmin(false);
        setUsername(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    // Defer to avoid deadlocks inside the auth callback
    setTimeout(async () => {
      const [{ data: roleRow }, { data: prof }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .maybeSingle(),
      ]);
      setIsAdmin(!!roleRow);
      setUsername(prof?.username ?? null);
    }, 0);
  }, [session]);

  return {
    session,
    user: session?.user ?? null,
    loading,
    isAdmin,
    username,
  };
}
