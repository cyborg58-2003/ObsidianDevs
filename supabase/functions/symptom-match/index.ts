// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()

    if (!query) {
      throw new Error('Query is required')
    }

    // Call Anthropic / OpenAI API or your preferred AI provider here
    // For the hackathon, we simulate an intelligent response if the AI API key isn't set
    const lowerQuery = query.toLowerCase();
    let specialty = "General Physician";
    
    if (lowerQuery.includes("heart") || lowerQuery.includes("chest")) specialty = "Cardiologist";
    if (lowerQuery.includes("skin") || lowerQuery.includes("rash")) specialty = "Dermatologist";
    if (lowerQuery.includes("brain") || lowerQuery.includes("headache")) specialty = "Neurologist";
    if (lowerQuery.includes("child") || lowerQuery.includes("baby")) specialty = "Pediatrician";
    if (lowerQuery.includes("bone") || lowerQuery.includes("joint")) specialty = "Orthopedist";
    if (lowerQuery.includes("tooth") || lowerQuery.includes("teeth")) specialty = "Dentist";
    if (lowerQuery.includes("eye") || lowerQuery.includes("vision")) specialty = "Ophthalmologist";

    const result = {
      specialty: specialty,
      confidence: 0.95,
      suggestedKeywords: [specialty.toLowerCase(), "consultation", "treatment"]
    };

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
