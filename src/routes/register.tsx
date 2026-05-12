// @ts-nocheck
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Stethoscope, Loader2, User2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { SPECIALTIES, CITIES } from "@/data/doctors";
import { cn } from "@/lib/utils";

function calculateStrength(password: string) {
  let score = 0;
  if (!password) return score;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

function getStrengthColor(score: number) {
  if (score === 1) return "bg-red-500";
  if (score === 2) return "bg-yellow-500";
  if (score === 3) return "bg-blue-500";
  if (score >= 4) return "bg-green-500";
  return "bg-transparent";
}

function getStrengthLabel(score: number) {
  if (score === 1) return "Weak";
  if (score === 2) return "Fair";
  if (score === 3) return "Good";
  if (score >= 4) return "Strong";
  return "";
}

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Smart Doctor Connect AI" },
      { name: "description", content: "Sign up as a patient or doctor and start using AI-assisted healthcare." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "",
    specialty: SPECIALTIES[0], city: CITIES[0], consultation: "Both",
    experience: "5", fee: "2000",
  });
  const [loading, setLoading] = useState(false);

  const passwordStrength = calculateStrength(form.password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords don't match");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);

    // 1. Sign up user
    const { error, data } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, role },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      return toast.error("Account created but could not get user ID. Please sign in.");
    }

    // 2. Insert into profiles table
    const { error: profileErr } = await supabase.from("profiles").insert({
      id: userId,
      role,
      name: form.name,
      email: form.email,
      city: role === "doctor" ? form.city : null,
    });

    if (profileErr) {
      console.error("Profile insert error:", profileErr.message);
      // Non-fatal — user can still log in
    }

    // 3. For doctors, insert into doctors table
    if (role === "doctor") {
      const { error: doctorErr } = await supabase.from("doctors").insert({
        user_id: userId,
        specialization: form.specialty,
        consultation_type: form.consultation as "Online" | "Physical" | "Both",
        experience_years: parseInt(form.experience) || 0,
        fee: parseInt(form.fee) || 2000,
        is_available: false,
        rating: null,
        bio: null,
      });

      if (doctorErr) {
        console.error("Doctor insert error:", doctorErr.message);
      }
    }

    setLoading(false);
    toast.success("Account created — welcome!");
    nav({ to: role === "doctor" ? "/dashboard/doctor" : "/dashboard/patient" });
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-10">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold">Smart Doctor Connect AI</span>
        </Link>

        <Card className="w-full border-border/60 bg-card p-8 shadow-elegant">
          <h1 className="font-display text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose how you'll use Smart Doctor Connect.</p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
            <RoleTab active={role === "patient"} onClick={() => setRole("patient")} icon={<User2 className="h-4 w-4" />} label="Patient" />
            <RoleTab active={role === "doctor"} onClick={() => setRole("doctor")} icon={<Briefcase className="h-4 w-4" />} label="Doctor" />
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Full name</Label>
              <Input id="reg-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="reg-pass">Password</Label>
                <Input id="reg-pass" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                {form.password.length > 0 && (
                  <div className="mt-1.5 flex flex-col gap-1">
                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      {[1, 2, 3, 4].map((index) => (
                        <div
                          key={index}
                          className={cn(
                            "h-full flex-1 border-r border-background last:border-r-0 transition-colors duration-300",
                            passwordStrength >= index ? getStrengthColor(passwordStrength) : "bg-transparent"
                          )}
                        />
                      ))}
                    </div>
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-semibold text-right",
                      passwordStrength === 1 ? "text-red-500" :
                      passwordStrength === 2 ? "text-yellow-500" :
                      passwordStrength === 3 ? "text-blue-500" :
                      passwordStrength >= 4 ? "text-green-500" : "text-muted-foreground"
                    )}>
                      {getStrengthLabel(passwordStrength)}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm">Confirm</Label>
                <Input id="reg-confirm" type="password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
              </div>
            </div>

            {role === "doctor" && (
              <>
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select value={form.consultation} onValueChange={(v) => setForm({ ...form, consultation: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Physical">Physical</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="reg-exp">Years experience</Label>
                    <Input id="reg-exp" type="number" min="0" max="50" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-fee">Consultation fee (PKR)</Label>
                    <Input id="reg-fee" type="number" min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full shadow-elegant" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

function RoleTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        active ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon} {label}
    </button>
  );
}

