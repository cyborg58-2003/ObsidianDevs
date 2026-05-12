import { cn } from "@/lib/utils";

interface AvailabilityToggleProps {
  isAvailable: boolean;
  onToggle: () => void;
  loading?: boolean;
  className?: string;
}

export function AvailabilityToggle({ isAvailable, onToggle, loading, className }: AvailabilityToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50",
        isAvailable
          ? "bg-success/15 text-success hover:bg-success/25"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
      aria-label={isAvailable ? "Set offline" : "Set online"}
    >
      <span
        className={cn(
          "inline-block h-2.5 w-2.5 rounded-full transition-all duration-300",
          isAvailable ? "animate-pulse bg-success" : "bg-muted-foreground/50"
        )}
      />
      {loading ? "Updating…" : isAvailable ? "Available now" : "Offline"}
    </button>
  );
}
