// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    // Here you would connect to Claude / OpenAI to maintain conversation context.
    // For Hackathon purposes, we use a basic heuristic to reply professionally.
    
    let reply = "Hello! I am the AI Assistant for this clinic. The doctor is currently offline, but I can help answer basic questions or schedule a consultation for you. How can I help today?";
    
    const msg = message.toLowerCase();
    
    if (msg.includes("book") || msg.includes("appointment") || msg.includes("schedule")) {
      reply = "I'd be happy to help you book an appointment. You can select an available time slot directly from the calendar above. Is there a specific day you prefer?";
    } else if (msg.includes("cost") || msg.includes("price") || msg.includes("fee")) {
      reply = "Consultation fees vary by doctor. You can see the exact fee listed on the doctor's profile card. Would you like me to help you proceed with a booking?";
    } else if (msg.includes("pain") || msg.includes("hurt") || msg.includes("sick")) {
      reply = "I'm sorry to hear you're feeling unwell. Since I am an AI, I cannot provide medical diagnoses. I highly recommend booking the earliest available slot so the doctor can evaluate your symptoms properly.";
    }

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
