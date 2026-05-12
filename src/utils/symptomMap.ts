export const symptomToSpecialty: Record<string, string> = {
  // Orthopedist
  "back pain": "Orthopedist", "spine": "Orthopedist", "joint": "Orthopedist", "knee": "Orthopedist", 
  "bone": "Orthopedist", "fracture": "Orthopedist", "muscle pain": "Orthopedist", "arthritis": "Orthopedist", "sprain": "Orthopedist", "shoulder": "Orthopedist",
  
  // Cardiologist
  "chest pain": "Cardiologist", "heart": "Cardiologist", "palpitation": "Cardiologist", "blood pressure": "Cardiologist", 
  "cholesterol": "Cardiologist", "hypertension": "Cardiologist", "breathing issue": "Cardiologist", "dizziness": "Cardiologist",
  
  // Dermatologist
  "skin": "Dermatologist", "acne": "Dermatologist", "rash": "Dermatologist", "eczema": "Dermatologist", 
  "hair fall": "Dermatologist", "dandruff": "Dermatologist", "nail": "Dermatologist", "mole": "Dermatologist", "itching": "Dermatologist", "psoriasis": "Dermatologist",
  
  // Neurologist
  "headache": "Neurologist", "migraine": "Neurologist", "seizure": "Neurologist", "stroke": "Neurologist", 
  "numbness": "Neurologist", "tremor": "Neurologist", "memory": "Neurologist", "dementia": "Neurologist", "vertigo": "Neurologist",
  
  // Pediatrician
  "child": "Pediatrician", "kid": "Pediatrician", "baby": "Pediatrician", "vaccine": "Pediatrician", 
  "infant": "Pediatrician", "toddler": "Pediatrician", "growth": "Pediatrician", "bedwetting": "Pediatrician",
  
  // Psychiatrist / Psychologist
  "anxiety": "Psychiatrist", "depression": "Psychiatrist", "stress": "Psychiatrist", "sleep": "Psychiatrist", 
  "panic": "Psychiatrist", "bipolar": "Psychiatrist", "adhd": "Psychiatrist", "trauma": "Psychiatrist", "mental health": "Psychiatrist", "sad": "Psychiatrist",
  
  // Gynecologist
  "pregnancy": "Gynecologist", "period": "Gynecologist", "menstrual": "Gynecologist", 
  "pcos": "Gynecologist", "fertility": "Gynecologist", "uterus": "Gynecologist", "menopause": "Gynecologist", "ovary": "Gynecologist",
  
  // ENT Specialist
  "ear": "ENT Specialist", "nose": "ENT Specialist", "throat": "ENT Specialist", "sinus": "ENT Specialist", 
  "hearing": "ENT Specialist", "tonsils": "ENT Specialist", "voice": "ENT Specialist", "snoring": "ENT Specialist", "earache": "ENT Specialist",
  
  // Dentist
  "tooth": "Dentist", "teeth": "Dentist", "dental": "Dentist", "gum": "Dentist", 
  "cavity": "Dentist", "root canal": "Dentist", "braces": "Dentist", "bleeding gums": "Dentist", "jaw pain": "Dentist", "bad breath": "Dentist",
  
  // General Physician
  "fever": "General Physician", "cold": "General Physician", "flu": "General Physician", "cough": "General Physician", 
  "tiredness": "General Physician", "weakness": "General Physician", "body ache": "General Physician", "infection": "General Physician", "chills": "General Physician",
  
  // Gastroenterologist
  "stomach": "Gastroenterologist", "digestion": "Gastroenterologist", "acid reflux": "Gastroenterologist", "ulcer": "Gastroenterologist", 
  "constipation": "Gastroenterologist", "diarrhea": "Gastroenterologist", "liver": "Gastroenterologist", "vomiting": "Gastroenterologist", "nausea": "Gastroenterologist",
  
  // Ophthalmologist
  "eye": "Ophthalmologist", "vision": "Ophthalmologist", "cataract": "Ophthalmologist", "blindness": "Ophthalmologist", 
  "glaucoma": "Ophthalmologist", "glasses": "Ophthalmologist", "red eye": "Ophthalmologist",
  
  // Urologist
  "urine": "Urologist", "kidney stone": "Urologist", "bladder": "Urologist", "prostate": "Urologist", "urinary": "Urologist",
  
  // Endocrinologist
  "diabetes": "Endocrinologist", "thyroid": "Endocrinologist", "hormones": "Endocrinologist", "weight gain": "Endocrinologist", "weight loss": "Endocrinologist",
  
  // Pulmonologist
  "lungs": "Pulmonologist", "asthma": "Pulmonologist", "breathing": "Pulmonologist", "tuberculosis": "Pulmonologist", "bronchitis": "Pulmonologist"
};

export function getSuggestedSpecialty(query: string): string | null {
  if (!query) return null;
  const q = query.toLowerCase();
  for (const k of Object.keys(symptomToSpecialty)) {
    if (q.includes(k)) return symptomToSpecialty[k];
  }
  return null;
}
