import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/genai@0.1.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, doctorId } = await req.json()
    
    // Initialize Gemini API client
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }
    
    const ai = new GoogleGenerativeAI({ apiKey });

    const systemPrompt = `You are a polite, professional, and empathetic AI receptionist for a medical clinic (Doctor ID: ${doctorId}). 
Your job is to assist patients when the doctor is unavailable. 
1. Ask the patient how you can help them.
2. If they have a medical issue, ask them for a brief description of their symptoms.
3. Help them understand that you are an AI and cannot diagnose them, but you will pass all information to the doctor.
4. Encourage them to book an appointment using the calendar interface.
Keep your responses very concise (1-3 sentences maximum) and conversational. Do not use markdown formatting.`;

    // Generate response using Gemini 1.5 Flash for speed
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: "Understood. I will act as the medical receptionist." }] },
            { role: 'user', parts: [{ text: message }] }
        ]
    });

    const reply = response.text;

    return new Response(
      JSON.stringify({ reply }),
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
