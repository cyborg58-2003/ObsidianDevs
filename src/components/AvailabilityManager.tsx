// @ts-nocheck
import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_SLOTS = Array.from({ length: 24 }, (_, h) => {
  const hh = String(h).padStart(2, "0");
  return [`${hh}:00`, `${hh}:30`];
}).flat();

interface Slot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface AvailabilityManagerProps {
  doctorId: string | null;
}

export function AvailabilityManager({ doctorId }: AvailabilityManagerProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({ day: "1", start: "09:00", end: "10:00" });

  const fetchSlots = async () => {
    if (!doctorId) return;
    setLoading(true);
    const { data } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("day_of_week")
      .order("start_time");
    setSlots((data ?? []) as Slot[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchSlots();
  }, [doctorId]);

  const addSlot = async () => {
    if (!doctorId) return;
    if (newSlot.start >= newSlot.end) {
      toast.error("End time must be after start time");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("availability_slots").insert({
      doctor_id: doctorId,
      day_of_week: parseInt(newSlot.day),
      start_time: newSlot.start,
      end_time: newSlot.end,
      is_booked: false,
    });
    setAdding(false);
    if (error) toast.error("Failed to add slot");
    else {
      toast.success("Slot added");
      fetchSlots();
    }
  };

  const deleteSlot = async (id: string) => {
    await supabase.from("availability_slots").delete().eq("id", id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
    toast.success("Slot removed");
  };

  // Group slots by day
  const byDay = DAYS.map((dayName, dayIdx) => ({
    dayName,
    dayIdx,
    slots: slots.filter((s) => s.day_of_week === dayIdx),
  })).filter((d) => d.slots.length > 0);

  if (!doctorId) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">Save your profile first to manage availability slots.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add slot form */}
      <Card className="border-border/60 p-6 shadow-soft">
        <h3 className="font-display text-lg font-semibold">Add availability slot</h3>
        <p className="mt-1 text-sm text-muted-foreground">Set the days and times you're available for appointments.</p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Day</label>
            <Select value={newSlot.day} onValueChange={(v) => setNewSlot({ ...newSlot, day: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d, i) => (
                  <SelectItem key={d} value={String(i)}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Start time</label>
            <Select value={newSlot.start} onValueChange={(v) => setNewSlot({ ...newSlot, start: v })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {TIME_SLOTS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">End time</label>
            <Select value={newSlot.end} onValueChange={(v) => setNewSlot({ ...newSlot, end: v })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {TIME_SLOTS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addSlot} disabled={adding} className="shadow-elegant">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add slot
          </Button>
        </div>
      </Card>

      {/* Existing slots */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : byDay.length === 0 ? (
        <Card className="border-dashed p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <p className="mt-3 font-semibold">No slots yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your available times above to start receiving bookings.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {byDay.map(({ dayName, dayIdx, slots: daySlots }) => (
            <Card key={dayIdx} className="border-border/60 p-5 shadow-soft">
              <div className="mb-3 font-display font-semibold">{dayName}</div>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                      slot.is_booked
                        ? "border-muted bg-muted/50 text-muted-foreground"
                        : "border-border/60 bg-card"
                    }`}
                  >
                    <span>{slot.start_time} – {slot.end_time}</span>
                    {slot.is_booked ? (
                      <Badge variant="secondary" className="text-xs">Booked</Badge>
                    ) : (
                      <button
                        onClick={() => deleteSlot(slot.id)}
                        className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                        aria-label="Remove slot"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

