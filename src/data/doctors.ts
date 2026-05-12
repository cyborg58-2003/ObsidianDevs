export type ConsultationType = "Online" | "Physical" | "Both";

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  city: string;
  rating: number;
  reviews: number;
  experience: number;
  fee: number;
  consultation: ConsultationType;
  bio: string;
  initials: string;
  color: string;
  available: string[];
}

export const SPECIALTIES = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedist",
  "Pediatrician",
  "Psychiatrist",
  "Gynecologist",
  "ENT Specialist",
  "Dentist",
];

export const CITIES = ["Lahore", "Karachi", "Islamabad", "Wah Cantt", "Rawalpindi", "Faisalabad"];

export const DOCTORS: Doctor[] = [
  { id: "d1", name: "Dr. Ayesha Khan", specialty: "Cardiologist", city: "Lahore", rating: 4.9, reviews: 312, experience: 12, fee: 2500, consultation: "Both", bio: "Interventional cardiologist specializing in preventive care and heart rhythm disorders.", initials: "AK", color: "oklch(0.74 0.16 40)", available: ["Mon 10:00", "Mon 14:00", "Tue 11:00", "Wed 15:00"] },
  { id: "d2", name: "Dr. Bilal Ahmed", specialty: "Dermatologist", city: "Karachi", rating: 4.8, reviews: 244, experience: 9, fee: 2000, consultation: "Online", bio: "Cosmetic and clinical dermatology, acne, eczema, and laser treatments.", initials: "BA", color: "oklch(0.55 0.20 290)", available: ["Mon 09:00", "Tue 13:00", "Thu 16:00"] },
  { id: "d3", name: "Dr. Sana Iqbal", specialty: "Pediatrician", city: "Islamabad", rating: 5.0, reviews: 489, experience: 15, fee: 1800, consultation: "Both", bio: "Newborn and child wellness, vaccinations, and developmental check-ups.", initials: "SI", color: "oklch(0.68 0.15 155)", available: ["Mon 11:00", "Wed 10:00", "Fri 14:00"] },
  { id: "d4", name: "Dr. Hamza Riaz", specialty: "Orthopedist", city: "Wah Cantt", rating: 4.7, reviews: 178, experience: 11, fee: 2200, consultation: "Physical", bio: "Joint replacement, sports injuries, and spine care.", initials: "HR", color: "oklch(0.58 0.13 195)", available: ["Tue 09:00", "Thu 11:00", "Sat 10:00"] },
  { id: "d5", name: "Dr. Mehak Tariq", specialty: "Neurologist", city: "Lahore", rating: 4.9, reviews: 201, experience: 14, fee: 3000, consultation: "Both", bio: "Headaches, epilepsy, and stroke recovery. Adult neurology focus.", initials: "MT", color: "oklch(0.65 0.16 220)", available: ["Mon 16:00", "Wed 12:00", "Fri 09:00"] },
  { id: "d6", name: "Dr. Usman Sheikh", specialty: "General Physician", city: "Rawalpindi", rating: 4.6, reviews: 356, experience: 8, fee: 1200, consultation: "Both", bio: "Family medicine, chronic disease management, and routine consultations.", initials: "US", color: "oklch(0.74 0.16 40)", available: ["Daily 09:00–17:00"] },
  { id: "d7", name: "Dr. Nida Aslam", specialty: "Gynecologist", city: "Karachi", rating: 4.9, reviews: 412, experience: 16, fee: 2500, consultation: "Both", bio: "Women's health, pregnancy care, and minimally invasive surgery.", initials: "NA", color: "oklch(0.55 0.20 290)", available: ["Mon 10:00", "Tue 15:00", "Thu 11:00"] },
  { id: "d8", name: "Dr. Faisal Mirza", specialty: "Psychiatrist", city: "Islamabad", rating: 4.8, reviews: 167, experience: 10, fee: 2800, consultation: "Online", bio: "Anxiety, depression, sleep, and ADHD assessments for adults.", initials: "FM", color: "oklch(0.68 0.15 155)", available: ["Tue 17:00", "Wed 18:00", "Sat 12:00"] },
  { id: "d9", name: "Dr. Zara Hussain", specialty: "ENT Specialist", city: "Lahore", rating: 4.7, reviews: 145, experience: 7, fee: 1900, consultation: "Both", bio: "Sinus, hearing, and pediatric ENT. Endoscopic procedures.", initials: "ZH", color: "oklch(0.58 0.13 195)", available: ["Mon 13:00", "Thu 10:00"] },
  { id: "d10", name: "Dr. Omar Javed", specialty: "Dentist", city: "Faisalabad", rating: 4.8, reviews: 289, experience: 13, fee: 1500, consultation: "Physical", bio: "Cosmetic dentistry, implants, and orthodontics.", initials: "OJ", color: "oklch(0.65 0.16 220)", available: ["Mon–Sat 10:00–19:00"] },
];

export function getDoctor(id: string) {
  return DOCTORS.find((d) => d.id === id);
}
