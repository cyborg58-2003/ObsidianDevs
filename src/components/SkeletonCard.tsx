import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  variant?: "doctor" | "appointment";
}

export function SkeletonCard({ className, variant = "doctor" }: SkeletonCardProps) {
  if (variant === "appointment") {
    return (
      <div className={cn("rounded-2xl border border-border/60 bg-card p-5 shadow-soft flex gap-4 items-center", className)}>
        <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded-lg bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-16 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card p-5 shadow-soft", className)}>
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded-lg bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded-lg bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("h-4 animate-pulse rounded-lg bg-muted", className)} />;
}

export function SkeletonAvatar({ size = 10 }: { size?: number }) {
  return (
    <div
      className="animate-pulse rounded-xl bg-muted"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  );
}
