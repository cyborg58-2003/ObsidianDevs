// @ts-nocheck
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  slot_id: string | null;
  status: "pending" | "confirmed" | "done" | "cancelled";
  notes: string | null;
  appointment_at: string;
  created_at: string;
  // Joined profile data
  doctor_name?: string;
  doctor_specialization?: string;
  doctor_avatar?: string;
  patient_name?: string;
}

export function useAppointments(userId: string | null, role: "doctor" | "patient" | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!userId || !role) return;
    setLoading(true);
    try {
      if (role === "patient") {
        const { data, error } = await supabase
          .from("appointments")
          .select(`
            *,
            doctors!appointments_doctor_id_fkey (
              specialization,
              profiles!doctors_user_id_fkey ( name, avatar_url )
            )
          `)
          .eq("patient_id", userId)
          .order("appointment_at", { ascending: true });

        if (error) console.error("Patient appointments error:", error);

        const mapped: Appointment[] = (data ?? []).map((a: Record<string, unknown>) => ({
          id: a.id as string,
          doctor_id: a.doctor_id as string,
          patient_id: a.patient_id as string,
          slot_id: a.slot_id as string | null,
          status: a.status as Appointment["status"],
          notes: a.notes as string | null,
          appointment_at: a.appointment_at as string,
          created_at: a.created_at as string,
          doctor_name: ((a.doctors as Record<string, unknown>)?.profiles as Record<string, unknown>)?.name as string | undefined,
          doctor_specialization: ((a.doctors as Record<string, unknown>)?.specialization) as string | undefined,
          doctor_avatar: ((a.doctors as Record<string, unknown>)?.profiles as Record<string, unknown>)?.avatar_url as string | undefined,
        }));
        setAppointments(mapped);
      } else {
        // Doctor: get their doctor id first
        const { data: doctorData, error: doctorErr } = await supabase
          .from("doctors")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (doctorErr) console.error("Doctor lookup error:", doctorErr);
        if (!doctorData) return;

        const { data, error } = await supabase
          .from("appointments")
          .select(`
            *,
            profiles!appointments_patient_id_fkey ( name, avatar_url )
          `)
          .eq("doctor_id", doctorData.id)
          .order("appointment_at", { ascending: true });

        if (error) console.error("Doctor appointments error:", error);

        const mapped: Appointment[] = (data ?? []).map((a: Record<string, unknown>) => ({
          id: a.id as string,
          doctor_id: a.doctor_id as string,
          patient_id: a.patient_id as string,
          slot_id: a.slot_id as string | null,
          status: a.status as Appointment["status"],
          notes: a.notes as string | null,
          appointment_at: a.appointment_at as string,
          created_at: a.created_at as string,
          patient_name: ((a.profiles as Record<string, unknown>)?.name) as string | undefined,
          patient_avatar: ((a.profiles as Record<string, unknown>)?.avatar_url) as string | undefined,
        }));
        setAppointments(mapped);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const updateStatus = async (id: string, status: Appointment["status"]) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const deleteAppointment = async (id: string) => {
    await supabase.from("appointments").delete().eq("id", id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  return { appointments, loading, updateStatus, deleteAppointment, refetch: fetchAppointments };
}

