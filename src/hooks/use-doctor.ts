// @ts-nocheck
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DoctorProfile {
  id: string;
  user_id: string;
  specialization: string | null;
  consultation_type: "Online" | "Physical" | "Both" | null;
  experience_years: number | null;
  bio: string | null;
  rating: number | null;
  is_available: boolean;
  fee: number | null;
}

export function useDoctor(userId: string | null) {
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctor = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from("doctors")
      .select("*")
      .eq("user_id", userId)
      .single();
    setLoading(false);
    if (err) setError(err.message);
    else setDoctor(data as DoctorProfile);
  }, [userId]);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  const updateDoctor = async (updates: Partial<Omit<DoctorProfile, "id" | "user_id">>) => {
    if (!doctor?.id) return { error: "No doctor record" };
    const { error: err } = await supabase
      .from("doctors")
      .update(updates)
      .eq("id", doctor.id);
    if (!err) setDoctor((prev) => prev ? { ...prev, ...updates } : prev);
    return { error: err?.message ?? null };
  };

  const toggleAvailability = async () => {
    if (!doctor) return;
    const newVal = !doctor.is_available;
    setDoctor((prev) => prev ? { ...prev, is_available: newVal } : prev);
    await supabase
      .from("doctors")
      .update({ is_available: newVal })
      .eq("id", doctor.id);
  };

  return { doctor, loading, error, updateDoctor, toggleAvailability, refetch: fetchDoctor };
}

export async function getDoctorById(doctorId: string) {
  const { data } = await supabase
    .from("doctors")
    .select(`
      *,
      profiles!doctors_user_id_fkey (
        name,
        email,
        avatar_url,
        city
      )
    `)
    .eq("id", doctorId)
    .single();
  return data;
}

