export const symptomToSpecialty: Record<string, string> = {
  "back pain": "Orthopedist", "spine": "Orthopedist", "joint": "Orthopedist", "knee": "Orthopedist",
  "chest pain": "Cardiologist", "heart": "Cardiologist", "palpitation": "Cardiologist", "blood pressure": "Cardiologist",
  "skin": "Dermatologist", "acne": "Dermatologist", "rash": "Dermatologist", "eczema": "Dermatologist",
  "headache": "Neurologist", "migraine": "Neurologist", "seizure": "Neurologist", "stroke": "Neurologist",
  "child": "Pediatrician", "kid": "Pediatrician", "baby": "Pediatrician", "vaccine": "Pediatrician",
  "anxiety": "Psychiatrist", "depression": "Psychiatrist", "stress": "Psychiatrist", "sleep": "Psychiatrist",
  "pregnancy": "Gynecologist", "period": "Gynecologist", "menstrual": "Gynecologist",
  "ear": "ENT Specialist", "nose": "ENT Specialist", "throat": "ENT Specialist", "sinus": "ENT Specialist",
  "tooth": "Dentist", "teeth": "Dentist", "dental": "Dentist", "gum": "Dentist",
  "fever": "General Physician", "cold": "General Physician", "flu": "General Physician", "cough": "General Physician",
};

export function getSuggestedSpecialty(query: string): string | null {
  if (!query) return null;
  const q = query.toLowerCase();
  for (const k of Object.keys(symptomToSpecialty)) {
    if (q.includes(k)) return symptomToSpecialty[k];
  }
  return null;
}
