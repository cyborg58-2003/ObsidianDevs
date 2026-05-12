import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

interface AuthGuardProps {
  role: "doctor" | "patient";
  children: React.ReactNode;
}

/**
 * Wrap a component with AuthGuard to restrict access by role.
 * Redirects to /login if unauthenticated, or back to / if wrong role.
 */
export function AuthGuard({ role, children }: AuthGuardProps) {
  const { user, loading, role: userRole } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const returnTo = window.location.pathname;
      nav({ to: "/login", search: { returnTo } });
      return;
    }
    if (userRole && userRole !== role) {
      nav({ to: userRole === "doctor" ? "/dashboard/doctor" : "/dashboard/patient" });
    }
  }, [loading, user, userRole, role, nav]);

  if (loading || !user || (userRole && userRole !== role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
