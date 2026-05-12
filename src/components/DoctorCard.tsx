// @ts-nocheck
import { Link } from "@tanstack/react-router";
import { MapPin, Star, Stethoscope, Video, User2, Wifi } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Doctor } from "@/data/doctors";
import type { DbDoctor } from "@/routes/search";

// ─── Unified props ────────────────────────────────────────────────────────────
// variant="mock"  → legacy Doctor from @/data/doctors (used on landing page)
// variant="db"    → real DbDoctor from Supabase (used on search / patient dashboard)
type Props =
  | { variant?: "mock"; doctor: Doctor }
  | { variant: "db"; doctor: DbDoctor };

export function DoctorCard({ doctor, variant = "mock" }: Props) {
  // Normalise to a common view model
  const d =
    variant === "db"
      ? normDb(doctor as DbDoctor)
      : normMock(doctor as Doctor);

  return (
    <Card className="group flex flex-col gap-4 border-border/60 bg-gradient-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
      {/* Top row: avatar + name + rating */}
      <div className="flex items-start gap-4">
        <Avatar name={d.name} avatarUrl={d.avatarUrl} color={d.color} />

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-semibold leading-tight truncate">
            {d.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{d.specialty}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {d.city}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-sm font-semibold">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            {d.rating}
          </div>
          {d.reviews !== null && (
            <div className="text-xs text-muted-foreground">({d.reviews})</div>
          )}
          {/* Availability dot for DB doctors */}
          {variant === "db" && (
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  (doctor as DbDoctor).is_available
                    ? "bg-success"
                    : "bg-muted-foreground"
                }`}
              />
              <span className="text-muted-foreground">
                {(doctor as DbDoctor).is_available ? "Online" : "Offline"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="font-normal">
          {d.experience}+ yrs exp
        </Badge>
        {d.consultation !== "Physical" && (
          <Badge variant="secondary" className="font-normal">
            <Video className="mr-1 h-3 w-3" /> Online
          </Badge>
        )}
        {d.consultation !== "Online" && (
          <Badge variant="secondary" className="font-normal">
            <User2 className="mr-1 h-3 w-3" /> In-person
          </Badge>
        )}
      </div>

      {/* Fee + CTA */}
      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <div>
          <div className="text-xs text-muted-foreground">Consultation fee</div>
          <div className="font-display text-lg font-semibold">
            PKR {d.fee.toLocaleString()}
          </div>
        </div>
        <Button asChild size="sm" className="shadow-elegant">
          <Link to="/doctor/$id" params={{ id: d.id }}>
            View profile
          </Link>
        </Button>
      </div>
    </Card>
  );
}

// ─── Avatar sub-component ─────────────────────────────────────────────────────
function Avatar({
  name,
  avatarUrl,
  color,
}: {
  name: string;
  avatarUrl?: string | null;
  color?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-14 w-14 shrink-0 rounded-2xl object-cover"
      />
    );
  }

  const COLORS = [
    "oklch(0.74 0.16 40)",
    "oklch(0.55 0.20 290)",
    "oklch(0.68 0.15 155)",
    "oklch(0.58 0.13 195)",
    "oklch(0.65 0.16 220)",
  ];

  const bg =
    color ??
    COLORS[
      initials.charCodeAt(0) % COLORS.length
    ];

  return (
    <div
      className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-lg font-semibold text-white"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  );
}

// ─── Normalizers ──────────────────────────────────────────────────────────────
function normMock(d: Doctor) {
  return {
    id: d.id,
    name: d.name,
    specialty: d.specialty,
    city: d.city,
    rating: d.rating,
    reviews: d.reviews,
    experience: d.experience,
    fee: d.fee,
    consultation: d.consultation as "Online" | "Physical" | "Both",
    avatarUrl: null,
    color: d.color,
  };
}

function normDb(d: DbDoctor) {
  return {
    id: d.id,
    name: d.profiles?.name ?? "Doctor",
    specialty: d.specialization ?? "General Physician",
    city: d.profiles?.city ?? "Pakistan",
    rating: d.rating ?? 4.5,
    reviews: null,
    experience: d.experience_years ?? 0,
    fee: d.fee ?? 1500,
    consultation: (d.consultation_type ?? "Both") as "Online" | "Physical" | "Both",
    avatarUrl: d.profiles?.avatar_url ?? null,
    color: undefined,
  };
}
