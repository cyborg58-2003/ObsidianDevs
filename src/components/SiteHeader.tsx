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
        .eq("user_id", user.id)
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
        <Button variant="ghost" size="icon" className="group relative hover:bg-primary/10 transition-colors">
          <Bell className={cn("h-5 w-5 text-muted-foreground transition-all group-hover:text-primary", unreadCount > 0 && "animate-pulse text-primary")} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm ring-2 ring-background">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 border-border/60 bg-background/95 backdrop-blur-xl shadow-elegant p-0 overflow-hidden rounded-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
          <span className="font-display font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Bell className="h-6 w-6 text-primary/40" />
            </div>
            <p className="text-sm font-medium">You're all caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">No new notifications right now.</p>
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto overflow-x-hidden p-1 scrollbar-thin">
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex gap-3 items-start p-3 rounded-lg my-1 transition-colors hover:bg-muted/50 cursor-default focus:bg-muted/50">
                <div className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full mt-0.5",
                  !n.is_read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className={cn("font-semibold text-sm truncate", !n.is_read ? "text-foreground" : "text-foreground/80")}>
                      {n.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <span className={cn("text-xs mt-1 line-clamp-2", !n.is_read ? "text-muted-foreground" : "text-muted-foreground/70")}>
                    {n.message}
                  </span>
                </div>
                {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
