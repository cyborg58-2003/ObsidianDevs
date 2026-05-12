// @ts-nocheck
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export interface ProfileRow {
  id: string;
  role: "doctor" | "patient";
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: "patient" | "doctor" | null;
  displayName: string | null;
  profile: ProfileRow | null;
  doctorId: string | null;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setDoctorId(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileData) {
        setProfile(profileData as ProfileRow);

        if (profileData.role === "doctor") {
          const { data: doctorData } = await supabase
            .from("doctors")
            .select("id")
            .eq("user_id", userId)
            .single();
          setDoctorId(doctorData?.id ?? null);
        }
      }
    } catch {
      // Profile may not exist yet (e.g. right after signup)
    } finally {
      setLoading(false);
    }
  }

  const user = session?.user ?? null;
  const meta = (user?.user_metadata ?? {}) as {
    role?: "patient" | "doctor";
    full_name?: string;
  };

  // Prefer DB profile role, fall back to metadata
  const role = (profile?.role ?? meta.role) || null;
  const displayName =
    profile?.name ?? meta.full_name ?? user?.email ?? null;

  return { user, session, loading, role, displayName, profile, doctorId };
}

