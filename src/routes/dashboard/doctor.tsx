// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CalendarCheck, Star, Users, TrendingUp, Loader2,
  Save, Phone, MapPin, Briefcase, Clock, DollarSign,
  MessageSquare, CheckCircle, XCircle, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { AvatarUploader } from "@/components/AvatarUploader";
import { AvailabilityToggle } from "@/components/AvailabilityToggle";
import { AvailabilityManager } from "@/components/AvailabilityManager";
import { SkeletonCard, SkeletonLine } from "@/components/SkeletonCard";
import { DoctorInbox } from "@/components/DoctorInbox";
import { useAuth } from "@/hooks/use-auth";
import { useDoctor } from "@/hooks/use-doctor";
import { useAppointments } from "@/hooks/use-appointments";
import { supabase } from "@/integrations/supabase/client";
import { SPECIALTIES, CITIES } from "@/data/doctors";

export const Route = createFileRoute("/dashboard/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor Dashboard — Smart Doctor Connect AI" },
      { name: "description", content: "Manage your doctor profile, availability, and appointments." },
    ],
  }),
  component: () => (
    <AuthGuard role="doctor">
      <DoctorDashboard />
    </AuthGuard>
  ),
});

interface Lead {
  id: string;
  name: string | null;
  contact: string | null;
  problem_text: string | null;
  captured_by_ai: boolean;
  status: "new" | "contacted";
  created_at: string;
}

function DoctorDashboard() {
  const { user, displayName, profile, doctorId } = useAuth();
  const { doctor, loading: doctorLoading, updateDoctor, toggleAvailability } = useDoctor(user?.id ?? null);
  const { appointments, loading: apptLoading } = useAppointments(user?.id ?? null, "doctor");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    specialization: "",
    consultation_type: "Both",
    experience_years: "",
    fee: "",
    bio: "",
    avatar_url: "",
  });

  // Populate form once doctor data loads
  useEffect(() => {
    if (profile && doctor) {
      setForm({
        name: profile.name ?? "",
        phone: profile.phone ?? "",
        city: profile.city ?? "",
        specialization: doctor.specialization ?? "",
        consultation_type: doctor.consultation_type ?? "Both",
        experience_years: String(doctor.experience_years ?? ""),
        fee: String(doctor.fee ?? ""),
        bio: doctor.bio ?? "",
        avatar_url: profile.avatar_url ?? "",
      });
    }
  }, [profile, doctor]);

  // Fetch leads
  useEffect(() => {
    if (!doctorId) return;
    setLeadsLoading(true);
    supabase
      .from("leads")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setLeads((data ?? []) as Lead[]);
        setLeadsLoading(false);
      });
  }, [doctorId]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await toggleAvailability();
      toast.success(doctor?.is_available ? "You're now offline" : "You're now available!");
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Update profiles table
    await supabase.from("profiles").update({
      name: form.name,
      phone: form.phone || null,
      city: form.city,
      avatar_url: form.avatar_url || null,
    }).eq("id", user!.id);

    // Update doctors table
    const { error } = await updateDoctor({
      specialization: form.specialization,
      consultation_type: form.consultation_type as "Online" | "Physical" | "Both",
      experience_years: parseInt(form.experience_years) || 0,
      fee: parseInt(form.fee) || 0,
      bio: form.bio,
    });

    setSaving(false);
    if (error) toast.error("Failed to save profile");
    else toast.success("Profile saved successfully!");
  };

  // Stats
  const total = appointments.length;
  const pending = appointments.filter((a) => a.status === "pending").length;
  const avgRating = doctor?.rating ?? null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Good {getGreeting()}, {displayName?.split(" ")[0] ?? "Doctor"} 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              {doctor?.specialization ?? "Your specialty"} · {profile?.city ?? "Your city"}
            </p>
          </div>
          {doctorLoading ? (
            <div className="h-10 w-40 animate-pulse rounded-full bg-muted" />
          ) : (
            <AvailabilityToggle
              isAvailable={doctor?.is_available ?? false}
              onToggle={handleToggle}
              loading={toggling}
            />
          )}
        </div>

        {/* Stats cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<CalendarCheck className="h-5 w-5" />}
            label="Total appointments"
            value={apptLoading ? null : total}
            color="primary"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Pending requests"
            value={apptLoading ? null : pending}
            color="warning"
          />
          <StatCard
            icon={<Star className="h-5 w-5" />}
            label="Average rating"
            value={avgRating !== null ? avgRating.toFixed(1) : "—"}
            color="accent"
          />
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="profile" className="mt-8">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="appointments">
              Appointments
              {pending > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full bg-warning text-warning-foreground p-0 text-xs">
                  {pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="leads">
              Leads
              {leads.filter((l) => l.status === "new").length > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full bg-ai p-0 text-xs text-ai-foreground">
                  {leads.filter((l) => l.status === "new").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            {doctorLoading ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <form onSubmit={saveProfile}>
                <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                  {/* Avatar */}
                  <Card className="flex flex-col items-center border-border/60 p-6 shadow-soft">
                    <AvatarUploader
                      userId={user?.id ?? ""}
                      currentUrl={form.avatar_url}
                      onUploaded={(url) => setForm((f) => ({ ...f, avatar_url: url }))}
                    />
                  </Card>

                  {/* Form fields */}
                  <Card className="border-border/60 p-6 shadow-soft">
                    <h2 className="font-display text-lg font-semibold">Personal information</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="doc-name">Full name</Label>
                        <Input id="doc-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doc-phone">Phone</Label>
                        <Input id="doc-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92 300 0000000" />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                          <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                          <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Specialization</Label>
                        <Select value={form.specialization} onValueChange={(v) => setForm({ ...form, specialization: v })}>
                          <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                          <SelectContent>{SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Consultation type</Label>
                        <Select value={form.consultation_type} onValueChange={(v) => setForm({ ...form, consultation_type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Online">Online only</SelectItem>
                            <SelectItem value="Physical">In-person only</SelectItem>
                            <SelectItem value="Both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doc-exp">Years of experience</Label>
                        <Input id="doc-exp" type="number" min="0" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doc-fee">Consultation fee (PKR)</Label>
                        <Input id="doc-fee" type="number" min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label htmlFor="doc-bio">Professional bio</Label>
                      <Textarea
                        id="doc-bio"
                        rows={4}
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        placeholder="Tell patients about your expertise, approach, and experience…"
                      />
                    </div>

                    <Button type="submit" className="mt-5 shadow-elegant" disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save changes
                    </Button>
                  </Card>
                </div>
              </form>
            )}
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="mt-6">
            <AvailabilityManager doctorId={doctorId} />
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="mt-6">
            {apptLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : appointments.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck className="h-6 w-6" />}
                title="No appointments yet"
                description="When patients book with you, they'll appear here."
              />
            ) : (
              <div className="space-y-3">
                {appointments.map((a) => (
                  <Card key={a.id} className="flex flex-col gap-4 border-border/60 p-5 shadow-soft sm:flex-row sm:items-center">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                      <CalendarCheck className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-display font-semibold">{a.patient_name ?? "Patient"}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(a.appointment_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                      {a.notes && <div className="mt-1 text-xs text-muted-foreground italic">"{a.notes}"</div>}
                    </div>
                    <StatusBadge status={a.status} />
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="mt-6">
            {leadsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
            ) : leads.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-6 w-6" />}
                title="No leads yet"
                description="When the AI chat assistant captures a patient's details, leads will appear here."
              />
            ) : (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <Card key={lead.id} className="border-border/60 shadow-soft">
                    <button
                      className="flex w-full items-center gap-4 p-5 text-left"
                      onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-ai/10 text-ai">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{lead.name ?? "Anonymous"}</div>
                        <div className="text-sm text-muted-foreground">
                          {lead.contact ?? "No contact"} · {new Date(lead.created_at).toLocaleDateString("en-PK")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lead.status === "new" ? (
                          <Badge className="bg-ai/15 text-ai">New lead</Badge>
                        ) : (
                          <Badge variant="secondary">Contacted</Badge>
                        )}
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedLead === lead.id ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {expandedLead === lead.id && lead.problem_text && (
                      <div className="border-t border-border/60 bg-secondary/40 px-5 pb-5 pt-4">
                        <p className="text-sm font-medium text-muted-foreground">Problem description:</p>
                        <p className="mt-1 text-sm">{lead.problem_text}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={async () => {
                            await supabase.from("leads").update({ status: "contacted" }).eq("id", lead.id);
                            setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, status: "contacted" } : l));
                            toast.success("Marked as contacted");
                          }}
                        >
                          <CheckCircle className="h-4 w-4" /> Mark as contacted
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-6 outline-none">
            {doctor?.id ? (
              <DoctorInbox doctorId={doctor.id} />
            ) : (
              <Card className="p-8 text-center border-dashed">
                <p className="text-muted-foreground">Save your profile first to view messages.</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  color: "primary" | "warning" | "accent";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    accent: "bg-accent/10 text-accent",
  };
  return (
    <Card className="flex items-center gap-4 border-border/60 p-5 shadow-soft">
      <div className={`grid h-12 w-12 place-items-center rounded-xl ${colorMap[color]}`}>{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        {value === null ? (
          <div className="mt-0.5 h-7 w-16 animate-pulse rounded-lg bg-muted" />
        ) : (
          <div className="font-display text-2xl font-bold">{value}</div>
        )}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    confirmed: "bg-success/15 text-success",
    done: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return <Badge className={map[status] ?? ""}>{status}</Badge>;
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-dashed bg-gradient-soft p-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

