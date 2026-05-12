// @ts-nocheck
import { useEffect, useState } from "react";
import { CalendarCheck, ChevronRight, Clock, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

// Native date helpers (no date-fns required)
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Slot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  doctorId: string;
  doctorName: string;
  patientId: string;
  consultationFee?: number;
}

export function BookingModal({
  open,
  onClose,
  doctorId,
  doctorName,
  patientId,
  consultationFee,
}: BookingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  // Next 7 days
  const today = startOfToday();
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate]);

  const fetchSlots = async (date: Date) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    const dayOfWeek = date.getDay();

    const { data } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("doctor_id", doctorId)
      .eq("day_of_week", dayOfWeek)
      .order("start_time");

    setSlots((data ?? []) as Slot[]);
    setSlotsLoading(false);
  };

  const confirm = async () => {
    if (!selectedDate || !selectedSlot) return;
    setBooking(true);

    // Combine date + start_time into an ISO timestamp
    const [hour, minute] = selectedSlot.start_time.split(":").map(Number);
    const apptAt = new Date(selectedDate);
    apptAt.setHours(hour, minute, 0, 0);

    const { error } = await supabase.from("appointments").insert({
      doctor_id: doctorId,
      patient_id: patientId,
      slot_id: selectedSlot.id,
      status: "pending",
      notes: notes || null,
      appointment_at: apptAt.toISOString(),
    });

    if (error) {
      setBooking(false);
      return toast.error("Booking failed: " + error.message);
    }

    // Mark slot as booked
    await supabase
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", selectedSlot.id);

    // Try to send confirmation email via Edge Function
    try {
      await supabase.functions.invoke("send-email", {
        body: { type: "booking-confirmation", doctorName, patientId },
      });
    } catch {
      // Non-fatal: email may not be configured yet
    }

    setBooking(false);
    toast.success(`Appointment booked with ${doctorName}! ✓`);
    onClose();
    // Reset state
    setStep(1);
    setSelectedDate(null);
    setSelectedSlot(null);
    setNotes("");
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setSelectedDate(null);
    setSelectedSlot(null);
    setNotes("");
  };

  const availableSlots = slots.filter((s) => !s.is_booked);
  const bookedSlots = slots.filter((s) => s.is_booked);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg border-border/60 shadow-elegant">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Book with {doctorName}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-all",
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {s}
              </div>
              <span className={cn("text-xs", step >= s ? "text-foreground" : "text-muted-foreground")}>
                {s === 1 ? "Date" : s === 2 ? "Time" : "Notes"}
              </span>
              {s < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Date picker */}
        {step === 1 && (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">Select a date for your appointment:</p>
            <div className="grid grid-cols-7 gap-1.5">
              {weekDates.map((date) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "flex flex-col items-center rounded-xl p-2 text-xs transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-elegant"
                        : "border border-border/60 hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    <span className="font-medium">{DAY_NAMES[date.getDay()]}</span>
                    <span className="mt-0.5 font-bold">{date.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <Button
              className="mt-5 w-full shadow-elegant"
              disabled={!selectedDate}
              onClick={() => setStep(2)}
            >
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Time slot picker */}
        {step === 2 && (
          <div>
            <p className="mb-1 text-sm font-medium">
              {selectedDate ? selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : ""}
            </p>
            <p className="mb-3 text-sm text-muted-foreground">Choose an available time slot:</p>

            {slotsLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                No slots available for this day. Try another date.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "flex flex-col items-center rounded-xl border p-2.5 text-sm transition-all",
                        selectedSlot?.id === slot.id
                          ? "border-primary bg-primary text-primary-foreground shadow-elegant"
                          : "border-border/60 hover:border-primary/40"
                      )}
                    >
                      <Clock className="mb-0.5 h-3.5 w-3.5" />
                      {slot.start_time}
                    </button>
                  ))}
                  {bookedSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex flex-col items-center rounded-xl border border-border/40 bg-muted/40 p-2.5 text-xs text-muted-foreground opacity-50"
                    >
                      <Clock className="mb-0.5 h-3.5 w-3.5" />
                      {slot.start_time}
                      <span className="text-[10px]">Booked</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-5 flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1 shadow-elegant"
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Notes + confirm */}
        {step === 3 && (
          <div>
            <div className="rounded-xl bg-primary/5 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <CalendarCheck className="h-4 w-4 text-primary" />
                Booking summary
              </div>
              <div className="mt-2 space-y-1 text-muted-foreground">
                <div>{selectedDate ? formatDate(selectedDate) : ""}</div>
                <div>at {selectedSlot?.start_time} — {selectedSlot?.end_time}</div>
                {consultationFee && <div className="font-semibold text-foreground">PKR {consultationFee.toLocaleString()}</div>}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="booking-notes" className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Notes for the doctor (optional)
              </Label>
              <Textarea
                id="booking-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly describe your symptoms or reason for visit…"
                rows={3}
              />
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1 shadow-elegant"
                onClick={confirm}
                disabled={booking}
              >
                {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                Confirm booking
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

