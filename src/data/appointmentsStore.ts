import { useEffect, useState } from "react";

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  slot: string;
  type: "Online" | "Physical";
  status: "Upcoming" | "Completed" | "Cancelled";
  fee: number;
}

const KEY = "sdc_appointments_v1";

function read(): Appointment[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list: Appointment[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("sdc:appointments"));
}

export function useAppointments() {
  const [list, setList] = useState<Appointment[]>([]);
  useEffect(() => {
    setList(read());
    const sync = () => setList(read());
    window.addEventListener("sdc:appointments", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("sdc:appointments", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}

export function addAppointment(a: Omit<Appointment, "id" | "status">) {
  const list = read();
  list.unshift({ ...a, id: crypto.randomUUID(), status: "Upcoming" });
  write(list);
}

export function updateAppointmentStatus(id: string, status: Appointment["status"]) {
  const list = read().map((a) => (a.id === id ? { ...a, status } : a));
  write(list);
}
