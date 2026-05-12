// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current time
    const now = new Date();
    // Get time 24 hours from now
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // Let's grab appointments that are scheduled between 23.5 and 24.5 hours from now
    const lowerBound = new Date(tomorrow.getTime() - 30 * 60 * 1000).toISOString();
    const upperBound = new Date(tomorrow.getTime() + 30 * 60 * 1000).toISOString();

    const { data: appointments, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_at,
        patient_id,
        doctor_id,
        patient:profiles!appointments_patient_id_fkey(name, email),
        doctor:profiles!appointments_doctor_id_fkey(name)
      `)
      .eq("status", "pending")
      .eq("reminder_sent", false)
      .gte("appointment_at", lowerBound)
      .lte("appointment_at", upperBound);

    if (fetchError) {
      throw new Error(`Failed to fetch appointments: ${fetchError.message}`);
    }

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming appointments need reminders right now." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const results = [];

    for (const appt of appointments) {
      const patientEmail = appt.patient?.email;
      const patientName = appt.patient?.name || "Patient";
      const doctorName = appt.doctor?.name || "Doctor";
      const appointmentTime = new Date(appt.appointment_at).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      if (!patientEmail) continue;

      // Send via Resend
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Smart Doctor Connect <onboarding@resend.dev>",
          to: [patientEmail],
          subject: `Reminder: Upcoming Appointment with ${doctorName}`,
          html: `
            <h2>Appointment Reminder</h2>
            <p>Hi ${patientName},</p>
            <p>This is a friendly reminder that you have an upcoming appointment with <strong>${doctorName}</strong>.</p>
            <p><strong>When:</strong> ${appointmentTime}</p>
            <br/>
            <p>Please log in to your dashboard if you need to reschedule or cancel.</p>
            <p>Thank you,<br/>Smart Doctor Connect AI</p>
          `,
        }),
      });

      if (res.ok) {
        // Mark reminder as sent
        await supabase
          .from("appointments")
          .update({ reminder_sent: true })
          .eq("id", appt.id);
        
        results.push({ id: appt.id, status: "sent" });
      } else {
        results.push({ id: appt.id, status: "failed", error: await res.text() });
      }
    }

    return new Response(JSON.stringify({ message: "Reminders processed", results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
