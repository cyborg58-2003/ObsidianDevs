// @ts-nocheck
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Calendar, MessageSquare, Search, Video, User2, Ban,
  Loader2, Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SkeletonCard } from "@/components/SkeletonCard";

export const Route = createFileRoute("/appointments")({
  head: () => ({
    meta: [{ title: "My appointments — Smart Doctor Connect AI" }],
  }),
  component: AppointmentsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface Appt {
  id: string;
  appointment_at: string;
  status: "pending" | "confirmed" | "done" | "cancelled";
  notes: string | null;
  doctor_id: string;
  doctor: {
    id: string;
    specialization: string | null;
    consultation_type: "Online" | "Physical" | "Both" | null;
    fee: number | null;
    is_available: boolean;
    profiles: { name: string | null } | null;
  } | null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();

  const [list, setList] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [authLoading, user, nav]);

  // Fetch appointments
  useEffect(() => {
    if (!user) return;
    fetchAppts();
  }, [user]);

  const fetchAppts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `id, appointment_at, status, notes, doctor_id,
           doctor:doctors!appointments_doctor_id_fkey(
             id, specialization, consultation_type, fee, is_available,
             profiles!doctors_user_id_fkey(name)
           )`
        )
        .eq("patient_id", user!.id)
        .order("appointment_at", { ascending: false });

      if (error) throw error;
      setList((data as any) ?? []);
    } catch (err) {
      console.error("[appointments] fetch error:", err);
      toast.error("Could not load appointments");
    } finally {
      setLoading(false);
    }
  };

  const cancelAppt = async (id: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
      setList((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
      );
      toast.success("Appointment cancelled");
    } catch {
      toast.error("Failed to cancel — please try again");
    }
  };

  const now = new Date();
  const upcoming = list.filter(
    (a) =>
      a.status !== "cancelled" &&
      a.status !== "done" &&
      new Date(a.appointment_at) >= now
  );
  const past = list.filter(
    (a) =>
      a.status === "done" ||
      a.status === "cancelled" ||
      new Date(a.appointment_at) < now
  );

  if (authLoading || (loading && !list.length)) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
          <div className="h-8 w-56 animate-pulse rounded-xl bg-muted" />
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} variant="appointment" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              My appointments
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage your upcoming and past consultations.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/search">
              <Search className="h-4 w-4" /> Book new
            </Link>
          </Button>
        </div>

        {/* Empty state */}
        {list.length === 0 && !loading ? (
          <Card className="mt-8 border-dashed bg-gradient-soft p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <p className="mt-4 font-display text-lg font-semibold">
              No appointments yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Find a doctor and book in under a minute.
            </p>
            <Button asChild className="mt-5">
              <Link to="/search">Find a doctor</Link>
            </Button>
          </Card>
        ) : (
          <div className="mt-8 space-y-8">
            <Section title="Upcoming" count={upcoming.length}>
              {upcoming.length === 0 ? (
                <Empty text="No upcoming appointments." />
              ) : (
                upcoming.map((a) => (
                  <ApptRow key={a.id} a={a} onCancel={cancelAppt} />
                ))
              )}
            </Section>

            <Section title="Past & Cancelled" count={past.length}>
              {past.length === 0 ? (
                <Empty text="No past appointments." />
              ) : (
                past.map((a) => <ApptRow key={a.id} a={a} past />)
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <Badge variant="secondary">{count}</Badge>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; cls: string }
> = {
  pending: {
    label: "Pending",
    icon: AlertCircle,
    cls: "bg-warning/15 text-warning hover:bg-warning/15",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    cls: "bg-success/15 text-success hover:bg-success/15",
  },
  done: {
    label: "Completed",
    icon: CheckCircle2,
    cls: "bg-muted text-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    cls: "bg-destructive/15 text-destructive hover:bg-destructive/15",
  },
};

function ApptRow({
  a,
  past,
  onCancel,
}: {
  a: Appt;
  past?: boolean;
  onCancel?: (id: string) => void;
}) {
  const doctorName = a.doctor?.profiles?.name ?? "Doctor";
  const specialty = a.doctor?.specialization ?? "";
  const consultType = a.doctor?.consultation_type ?? "Online";
  const fee = a.doctor?.fee ?? 0;
  const apptDate = new Date(a.appointment_at);

  const s = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = s.icon;

  const isUpcoming = !past && a.status !== "cancelled";

  return (
    <Card className="flex flex-col gap-4 border-border/60 bg-gradient-card p-5 shadow-soft sm:flex-row sm:items-center">
      {/* Date block */}
      <div className="flex flex-col items-center justify-center h-14 w-14 shrink-0 rounded-xl bg-primary/10 text-primary text-center">
        <div className="text-xl font-bold font-display leading-none">
          {apptDate.getDate()}
        </div>
        <div className="text-[10px] uppercase tracking-wider">
          {apptDate.toLocaleDateString("en-PK", { month: "short" })}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {apptDate.toLocaleTimeString("en-PK", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="font-display text-base font-semibold truncate">
          {doctorName}
        </div>
        <div className="text-sm text-muted-foreground">
          {specialty}
          {a.notes && ` · "${a.notes.substring(0, 40)}…"`}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {consultType === "Online" ? (
            <Video className="mr-1 h-3 w-3" />
          ) : (
            <User2 className="mr-1 h-3 w-3" />
          )}
          {consultType}
        </Badge>
        <Badge className={s.cls}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {s.label}
        </Badge>
        <div className="font-display text-sm font-semibold">
          PKR {fee.toLocaleString()}
        </div>
      </div>

      {/* Actions */}
      {isUpcoming && (
        <div className="flex gap-2 shrink-0">
          <Button asChild size="sm" variant="outline">
            <Link
              to="/chat/$doctorId"
              params={{ doctorId: a.doctor_id }}
            >
              <MessageSquare className="h-4 w-4" /> Chat
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onCancel?.(a.id)}
          >
            <Ban className="h-4 w-4" /> Cancel
          </Button>
        </div>
      )}
    </Card>
  );
}
