// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Search, MapPin, Stethoscope, Clock, ArrowRight, Video, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useAuth } from "@/hooks/use-auth";
import { useAppointments } from "@/hooks/use-appointments";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/patient")({
  head: () => ({
    meta: [
      { title: "Patient Dashboard — Smart Doctor Connect AI" },
      { name: "description", content: "View your appointments and find doctors." },
    ],
  }),
  component: () => (
    <AuthGuard role="patient">
      <PatientDashboard />
    </AuthGuard>
  ),
});

function PatientDashboard() {
  const { user, displayName } = useAuth();
  const { appointments, loading, updateStatus } = useAppointments(user?.id ?? null, "patient");

  const upcoming = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  );
  const past = appointments.filter(
    (a) => a.status === "done" || a.status === "cancelled"
  );

  // Get unique recent doctors from appointment history
  const recentDoctors = Array.from(
    new Map(
      appointments
        .filter((a) => a.doctor_name)
        .map((a) => [a.doctor_id, a])
    ).values()
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Hello, {displayName?.split(" ")[0] ?? "there"} 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              Here's your health at a glance.
            </p>
          </div>
          <Button asChild className="shadow-elegant">
            <Link to="/search">
              <Search className="h-4 w-4" />
              Find a doctor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Quick search CTA */}
        <Card className="mt-6 flex items-center gap-4 border-border/60 bg-gradient-hero p-5 text-primary-foreground shadow-elegant">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/20">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold">Need a doctor?</div>
            <div className="text-sm text-primary-foreground/80">
              Describe your symptoms and our AI finds the right specialist.
            </div>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link to="/search">Search now</Link>
          </Button>
        </Card>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Appointments */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Upcoming appointments</h2>
              <Badge variant="secondary">{upcoming.length}</Badge>
            </div>

            {loading ? (
              <div className="mt-4 space-y-3">
                {[1, 2].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : upcoming.length === 0 ? (
              <Card className="mt-4 border-dashed bg-gradient-soft p-8 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="mt-3 font-semibold">No upcoming appointments</p>
                <p className="mt-1 text-sm text-muted-foreground">Book one in under a minute.</p>
                <Button asChild className="mt-4" size="sm">
                  <Link to="/search">Find a doctor</Link>
                </Button>
              </Card>
            ) : (
              <div className="mt-4 space-y-3">
                {upcoming.map((a) => (
                  <AppointmentRow key={a.id} appointment={a} onCancel={() => updateStatus(a.id, "cancelled")} />
                ))}
              </div>
            )}

            {past.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-muted-foreground">Past visits</h2>
                  <Badge variant="secondary">{past.length}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {past.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} past />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent doctors sidebar */}
          <div>
            <h2 className="font-display text-xl font-semibold">Doctors you've visited</h2>
            {recentDoctors.length === 0 ? (
              <Card className="mt-4 border-dashed p-6 text-center text-sm text-muted-foreground">
                Doctors you consult will appear here
              </Card>
            ) : (
              <div className="mt-4 space-y-3">
                {recentDoctors.map((a) => (
                  <Card key={a.doctor_id} className="flex items-center gap-3 border-border/60 p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary text-sm font-semibold">
                      {(a.doctor_name ?? "?").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-semibold text-sm">{a.doctor_name}</div>
                      <div className="truncate text-xs text-muted-foreground">{a.doctor_specialization}</div>
                    </div>
                    <Button asChild size="sm" variant="ghost" className="shrink-0">
                      <Link to="/search">Book again</Link>
                    </Button>
                  </Card>
                ))}
              </div>
            )}

            {/* Health tips card */}
            <Card className="mt-6 border-border/60 bg-gradient-soft p-5 shadow-soft">
              <h3 className="font-display font-semibold">💡 Health tip</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Regular check-ups every 6 months can catch 80% of preventable diseases early. Book a General Physician today.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                <Link to="/search" search={{ specialty: "General Physician" }}>Book check-up</Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AppointmentRowProps {
  appointment: ReturnType<typeof useAppointments>["appointments"][0];
  past?: boolean;
  onCancel?: () => void;
}

function AppointmentRow({ appointment: a, past, onCancel }: AppointmentRowProps) {
  const statusMap: Record<string, string> = {
    pending: "bg-warning/15 text-warning hover:bg-warning/15",
    confirmed: "bg-success/15 text-success hover:bg-success/15",
    done: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/15 text-destructive hover:bg-destructive/15",
  };

  return (
    <Card className="flex flex-col gap-3 border-border/60 bg-gradient-card p-5 shadow-soft sm:flex-row sm:items-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary text-sm font-bold">
        {(a.doctor_name ?? "DR").substring(0, 2).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="font-display font-semibold">{a.doctor_name ?? "Doctor"}</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Stethoscope className="h-3.5 w-3.5" />
          {a.doctor_specialization ?? "Specialist"}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <Clock className="h-3 w-3" />
          {new Date(a.appointment_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={statusMap[a.status] ?? ""}>{a.status}</Badge>
        {!past && onCancel && a.status === "pending" && (
          <Button size="sm" variant="ghost" onClick={onCancel} className="text-destructive hover:text-destructive">
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}

