// @ts-nocheck
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Stethoscope, LogOut, CalendarCheck, Search,
  LayoutDashboard, User2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, profile, displayName } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  // Role-aware dashboard link
  const dashboardTo =
    profile?.role === "doctor"
      ? "/dashboard/doctor"
      : "/dashboard/patient";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-semibold">Smart Doctor</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Connect AI</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/search" label="Find a Doctor" />
          {user && (
            <>
              <NavLink to="/appointments" label="Appointments" />
              <NavLink to={dashboardTo} label="Dashboard" />
            </>
          )}
        </nav>

        {/* Auth controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden text-right text-xs sm:block">
                <div className="font-medium">{displayName}</div>
                <div className="text-muted-foreground capitalize">
                  {profile?.role ?? "user"}
                </div>
              </div>
              <Button asChild size="sm" variant="ghost" className="hidden sm:flex">
                <Link to={dashboardTo}>
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="shadow-elegant">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex justify-around border-t border-border/60 px-4 py-2 md:hidden">
        <MobileLink to="/search" icon={<Search className="h-4 w-4" />} label="Find" />
        {user && (
          <>
            <MobileLink
              to="/appointments"
              icon={<CalendarCheck className="h-4 w-4" />}
              label="Bookings"
            />
            <MobileLink
              to={dashboardTo}
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Dashboard"
            />
          </>
        )}
      </nav>
    </header>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      activeProps={{ className: "text-foreground bg-secondary" }}
    >
      {label}
    </Link>
  );
}

function MobileLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      activeProps={{ className: "text-primary" }}
    >
      {icon}
      {label}
    </Link>
  );
}
