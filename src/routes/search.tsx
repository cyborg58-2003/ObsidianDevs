// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles, X, Loader2, SlidersHorizontal } from "lucide-react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { DoctorCard } from "@/components/DoctorCard";
import { SPECIALTIES, CITIES } from "@/data/doctors";
import { getSuggestedSpecialty } from "@/utils/symptomMap";
import { supabase } from "@/integrations/supabase/client";
import { SkeletonCard } from "@/components/SkeletonCard";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DbDoctor {
  id: string;
  user_id: string;
  specialization: string | null;
  consultation_type: "Online" | "Physical" | "Both" | null;
  experience_years: number | null;
  bio: string | null;
  rating: number | null;
  is_available: boolean;
  fee: number | null;
  profiles: { name: string | null; city: string | null; avatar_url: string | null } | null;
}

// ─── Route ────────────────────────────────────────────────────────────────────
const searchSchema = z.object({
  specialty: z.string().optional(),
  city: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Find a doctor — Smart Doctor Connect AI" },
      {
        name: "description",
        content:
          "Search verified doctors by symptom, specialty, or city. Online and in-person consultations.",
      },
    ],
  }),
  component: SearchPage,
});

// ─── Component ────────────────────────────────────────────────────────────────
function SearchPage() {
  const sp = Route.useSearch();

  const [q, setQ] = useState(sp.q ?? "");
  const [specialty, setSpecialty] = useState<string>(sp.specialty ?? "all");
  const [city, setCity] = useState<string>(sp.city ?? "all");
  const [type, setType] = useState<string>("all");

  const [doctors, setDoctors] = useState<DbDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Suggested specialty from local keyword map
  const suggested = useMemo(() => getSuggestedSpecialty(q), [q]);

  // ── Fetch from Supabase ───────────────────────────────────────────────────
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("doctors")
        .select(
          "id, user_id, specialization, consultation_type, experience_years, bio, rating, is_available, fee, profiles!doctors_user_id_fkey(name, city, avatar_url)"
        );

      if (specialty !== "all") {
        query = query.ilike("specialization", `%${specialty}%`);
      }
      if (type !== "all") {
        query = query.or(`consultation_type.eq.${type},consultation_type.eq.Both`);
      }

      const { data, error } = await query.order("rating", { ascending: false }).limit(50);

      if (error) throw error;

      let results: DbDoctor[] = (data as any) ?? [];

      // Apply city filter client-side (because city is in joined profiles)
      if (city !== "all") {
        results = results.filter(
          (d) => d.profiles?.city?.toLowerCase() === city.toLowerCase()
        );
      }

      // Apply text / AI-suggested specialty filter
      if (q.trim()) {
        const ql = q.toLowerCase();
        results = results.filter((d) => {
          const hay = `${d.profiles?.name ?? ""} ${d.specialization ?? ""} ${d.profiles?.city ?? ""} ${d.bio ?? ""}`.toLowerCase();
          if (hay.includes(ql)) return true;
          if (suggested && d.specialization?.toLowerCase().includes(suggested.toLowerCase())) return true;
          return false;
        });
      }

      setDoctors(results);
    } catch (err) {
      console.error("[search] fetch error:", err);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce refetch on filter changes
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(debounceRef.current);
  }, [q, specialty, city, type]);

  // ── AI symptom match (Edge Function) ─────────────────────────────────────
  const runAiMatch = async () => {
    if (!q.trim() || suggested) return; // already have local suggestion
    setAiLoading(true);
    try {
      const { data } = await supabase.functions.invoke("symptom-match", {
        body: { symptom: q },
      });
      if (data?.suggestedSpecialty) {
        setSpecialty(data.suggestedSpecialty);
      }
    } catch {
      // silently ignore — local fallback already in effect
    } finally {
      setAiLoading(false);
    }
  };

  const clear = () => {
    setQ("");
    setSpecialty("all");
    setCity("all");
    setType("all");
  };

  const hasFilters = q || specialty !== "all" || city !== "all" || type !== "all";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* ── Search Bar ── */}
      <section className="border-b border-border/60 bg-gradient-soft">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Find the right doctor
          </h1>
          <p className="mt-2 text-muted-foreground">
            Describe a symptom or pick a specialty — real doctors, real availability.
          </p>

          <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <div className="flex flex-col gap-3 md:flex-row">
              {/* Symptom / name search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onBlur={runAiMatch}
                  placeholder="e.g. chest pain, skin rash, child fever…"
                  className="h-11 pl-9"
                />
              </div>

              {/* Specialty */}
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger className="h-11 md:w-48">
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All specialties</SelectItem>
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* City */}
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-11 md:w-36">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Consultation type */}
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-11 md:w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any type</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Physical">In-person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AI suggestion chip */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {suggested && (
                <button
                  onClick={() => setSpecialty(suggested)}
                  className="inline-flex items-center gap-2 rounded-full border border-ai/30 bg-ai/10 px-3 py-1.5 text-sm text-ai transition-colors hover:bg-ai/15"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI suggests: <strong>{suggested}</strong>
                </button>
              )}
              {aiLoading && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing symptom…
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ── */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-5 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading doctors…
              </span>
            ) : (
              <>
                <strong className="text-foreground">{doctors.length}</strong>{" "}
                doctor{doctors.length === 1 ? "" : "s"} found
              </>
            )}
          </div>
          {hasFilters && !loading && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <X className="h-4 w-4" /> Clear filters
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} variant="doctor" />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card p-12 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <p className="font-display text-lg font-semibold">
              No doctors match your filters
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try removing a filter or searching a different symptom.
            </p>
            <Button onClick={clear} className="mt-4">
              Reset search
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <DoctorCard key={d.id} doctor={d} variant="db" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
