// @ts-nocheck
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Stethoscope, LogOut, CalendarCheck, Search,
  LayoutDashboard, User2, Bell, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
              <NotificationBell />
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

function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    
    await supabase
      .from("notifications" as any)
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
      
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <DropdownMenu onOpenChange={(open) => { if(open) markAllAsRead(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start p-3">
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-sm">{n.title}</span>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <span className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
