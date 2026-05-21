import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symptom, query, conversationHistory } = await req.json()
    const userMessage = symptom || query;

    if (!userMessage) {
      throw new Error('Message (symptom or query) is required')
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are "Smart Doctor AI", a helpful healthcare directory assistant for Pakistan.
Your job is to understand the user's symptoms and recommend the correct medical specialty (e.g., Cardiologist, Dermatologist, General Physician).
Be concise, friendly, and professional. Do NOT provide medical diagnoses.
At the very end of your response, output a special tag in this exact format: [SPECIALTY: <SpecialtyName>] if you recommend a specific doctor type. If no specific type, omit the tag.`;

    // Convert history format if available
    let history = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I am Smart Doctor AI." }] }
    ];

    if (conversationHistory && Array.isArray(conversationHistory)) {
        for (const msg of conversationHistory) {
            history.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    const text = result.response.text();

    // Extract specialty tag if present
    let suggestedSpecialty = null;
    const match = text.match(/\[SPECIALTY:\s*(.+?)\]/i);
    if (match) {
        suggestedSpecialty = match[1].trim();
    }
    
    // Clean reply
    const cleanReply = text.replace(/\[SPECIALTY:\s*.+?\]/gi, '').trim();

    return new Response(
      JSON.stringify({ 
        reply: cleanReply,
        suggestedSpecialty: suggestedSpecialty 
      }),
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
