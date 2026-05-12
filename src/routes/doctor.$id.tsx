// @ts-nocheck
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, MessageSquare, Star, Stethoscope,
  Video, User2, Calendar, DollarSign, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";
import { BookingModal } from "@/components/BookingModal";
import { ChatWidget } from "@/components/ChatWidget";
import { SkeletonCard } from "@/components/SkeletonCard";
import { getDoctor } from "@/data/doctors";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

// We try Supabase first, fall back to mock data
interface DoctorData {
  id: string;
  name: string;
  specialty: string;
  city: string;
  rating: number;
  reviews: number;
  experience: number;
  fee: number;
  consultation: "Online" | "Physical" | "Both";
  bio: string;
  initials: string;
  color: string;
  available: string[];
  is_available?: boolean;
  supabaseId?: string; // the doctors.id (UUID) if loaded from DB
}

export const Route = createFileRoute("/doctor/$id")({
  loader: async ({ params }) => {
    // Try loading from Supabase first
    try {
      const { data: dbDoctors } = await supabase
        .from("doctors")
        .select(`
          id,
          specialization,
          consultation_type,
          experience_years,
          bio,
          rating,
          is_available,
          fee,
          profiles!doctors_user_id_fkey ( id, name, avatar_url, city )
        `)
        .limit(50);

      if (dbDoctors && dbDoctors.length > 0) {
        // Try matching by UUID or by profile id
        const matched = dbDoctors.find((d) => {
          const prof = d.profiles as { id?: string; name?: string } | null;
          return d.id === params.id || prof?.id === params.id;
        });

        if (matched) {
          const prof = matched.profiles as { id?: string; name?: string; avatar_url?: string; city?: string } | null;
          const name = prof?.name ?? "Doctor";
          const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2);

          const doctor: DoctorData = {
            id: params.id,
            name,
            specialty: matched.specialization ?? "General Physician",
            city: prof?.city ?? "Pakistan",
            rating: matched.rating ?? 4.5,
            reviews: 0,
            experience: matched.experience_years ?? 0,
            fee: matched.fee ?? 2000,
            consultation: (matched.consultation_type as DoctorData["consultation"]) ?? "Both",
            bio: matched.bio ?? "",
            initials,
            color: "oklch(0.58 0.13 195)",
            available: [],
            is_available: matched.is_available ?? false,
            supabaseId: matched.id,
          };
          return { doctor, fromDb: true };
        }
      }
    } catch {
      // Fall through to mock data
    }

    // Fall back to mock data
    const doctor = getDoctor(params.id);
    if (!doctor) throw notFound();
    return {
      doctor: {
        ...doctor,
        is_available: false,
        supabaseId: undefined,
      } as DoctorData,
      fromDb: false,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.doctor.name} — ${loaderData.doctor.specialty} | Smart Doctor Connect AI` },
          { name: "description", content: `Book a consultation with ${loaderData.doctor.name}, ${loaderData.doctor.specialty} in ${loaderData.doctor.city}.` },
        ]
      : [],
  }),
  component: DoctorProfile,
});

function DoctorProfile() {
  const { doctor } = Route.useLoaderData();
  const { user, role } = useAuth();
  const nav = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(doctor.is_available ?? false);

  // Subscribe to doctor availability changes
  useEffect(() => {
    if (!doctor.supabaseId) return;
    const channel = supabase
      .channel(`doctor-avail:${doctor.supabaseId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "doctors", filter: `id=eq.${doctor.supabaseId}` },
        (payload) => {
          const rec = payload.new as { is_available?: boolean };
          if (typeof rec.is_available === "boolean") setIsAvailable(rec.is_available);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [doctor.supabaseId]);

  const handleBookClick = () => {
    if (!user) {
      toast.error("Please sign in to book an appointment");
      nav({ to: "/login" });
      return;
    }
    if (role === "doctor") {
      toast.error("Doctors cannot book appointments for themselves");
      return;
    }
    setBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/search" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to search
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Main */}
          <div className="space-y-6">
            <Card className="overflow-hidden border-border/60 bg-gradient-card p-6 shadow-soft">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div
                  className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl font-display text-2xl font-bold text-primary-foreground shadow-elegant"
                  style={{ backgroundColor: doctor.color }}
                >
                  {doctor.initials}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-display text-2xl font-bold md:text-3xl">{doctor.name}</h1>
                    {/* Live availability indicator */}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isAvailable ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-success animate-pulse" : "bg-muted-foreground/50"}`} />
                      {isAvailable ? "Available now" : "Offline"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5" /> {doctor.specialty}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {doctor.city}</span>
                    <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-warning text-warning" /> {doctor.rating} ({doctor.reviews} reviews)</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary"><Award className="mr-1 h-3 w-3" />{doctor.experience}+ yrs experience</Badge>
                    {doctor.consultation !== "Physical" && <Badge variant="secondary"><Video className="mr-1 h-3 w-3" /> Online</Badge>}
                    {doctor.consultation !== "Online" && <Badge variant="secondary"><User2 className="mr-1 h-3 w-3" /> In-person</Badge>}
                  </div>
                </div>
              </div>
              {doctor.bio && (
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">{doctor.bio}</p>
              )}
            </Card>

            <Card className="border-border/60 p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">About the practice</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <InfoBox label="Experience" value={`${doctor.experience} years`} />
                <InfoBox label="Consultation fee" value={`PKR ${doctor.fee.toLocaleString()}`} />
                <InfoBox label="Languages" value="English, Urdu" />
                <InfoBox label="Patient rating" value={`${doctor.rating} / 5`} />
                <InfoBox label="Mode" value={doctor.consultation} />
                <InfoBox label="City" value={doctor.city} />
              </div>
            </Card>
          </div>

          {/* Booking sidebar */}
          <Card className="h-fit border-border/60 bg-gradient-card p-6 shadow-elegant lg:sticky lg:top-24">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Consultation fee</div>
            <div className="mt-1 font-display text-3xl font-bold">PKR {doctor.fee.toLocaleString()}</div>

            <Button
              onClick={handleBookClick}
              className="mt-5 w-full shadow-elegant"
              size="lg"
            >
              <Calendar className="h-4 w-4" /> Book appointment
            </Button>

            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => nav({ to: "/chat/$doctorId", params: { doctorId: doctor.id } })}
            >
              <MessageSquare className="h-4 w-4" /> Message first
            </Button>

            <div className="mt-5 rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Booking is instant</p>
              <p className="mt-1">No phone calls needed. Choose a date, pick a time, and you're booked.</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Booking Modal */}
      {user && role === "patient" && (
        <BookingModal
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          doctorId={doctor.supabaseId ?? doctor.id}
          doctorName={doctor.name}
          patientId={user.id}
          consultationFee={doctor.fee}
        />
      )}

      {/* Chat Widget — always visible on doctor profile */}
      <ChatWidget
        doctorId={doctor.supabaseId ?? doctor.id}
        doctorName={doctor.name}
        isAvailable={isAvailable}
      />
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}

