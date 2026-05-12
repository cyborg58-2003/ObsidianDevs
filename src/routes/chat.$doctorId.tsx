// @ts-nocheck
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Sparkles, Stethoscope, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { getDoctor } from "@/data/doctors";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  is_ai_generated: boolean;
  created_at: string;
}

export const Route = createFileRoute("/chat/$doctorId")({
  loader: ({ params }) => {
    // We load just enough to show the header — full data loads client-side
    const mockDoctor = getDoctor(params.doctorId);
    return { doctorId: params.doctorId, mockDoctor };
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.mockDoctor
      ? [{ title: `Chat with ${loaderData.mockDoctor.name} — Smart Doctor Connect AI` }]
      : [{ title: "Chat — Smart Doctor Connect AI" }],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { doctorId, mockDoctor } = Route.useLoaderData();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [doctorSupabaseId, setDoctorSupabaseId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState(mockDoctor?.name ?? "Doctor");
  const [doctorSpecialty, setDoctorSpecialty] = useState(mockDoctor?.specialty ?? "");
  const [doctorColor, setDoctorColor] = useState(mockDoctor?.color ?? "oklch(0.58 0.13 195)");
  const [doctorInitials, setDoctorInitials] = useState(mockDoctor?.initials ?? "DR");
  const [initialized, setInitialized] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      nav({ to: "/login" });
    }
  }, [authLoading, user, nav]);

  useEffect(() => {
    if (user && !initialized) {
      initChat();
    }
  }, [user, initialized]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initChat = async () => {
    if (!user) return;

    // Try to resolve doctor from Supabase
    let resolvedDoctorId = doctorId;
    try {
      const { data: dbDoctors } = await supabase
        .from("doctors")
        .select(`id, specialization, is_available, profiles!doctors_user_id_fkey ( name )`)
        .limit(50);

      const matched = dbDoctors?.find((d) => d.id === doctorId);
      if (matched) {
        resolvedDoctorId = matched.id;
        setDoctorSupabaseId(matched.id);
        setIsAvailable(matched.is_available ?? false);
        const prof = matched.profiles as { name?: string } | null;
        if (prof?.name) {
          setDoctorName(prof.name);
          setDoctorInitials(prof.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2));
        }
        if (matched.specialization) setDoctorSpecialty(matched.specialization);
      } else {
        setIsAvailable(mockDoctor ? false : false);
      }
    } catch {
      // Keep mock values
    }

    // Get or create conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("doctor_id", resolvedDoctorId)
      .eq("patient_id", user.id)
      .single();

    let convId: string;
    if (existing?.id) {
      convId = existing.id;
    } else {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ doctor_id: resolvedDoctorId, patient_id: user.id })
        .select("id")
        .single();
      convId = newConv?.id ?? crypto.randomUUID();
    }
    setConversationId(convId);

    // Load messages
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at");

    if (msgs && msgs.length > 0) {
      setMessages(msgs as Message[]);
    } else {
      // Greeting
      setMessages([{
        id: "greeting",
        content: `Hi! I'm ${doctorName}. How can I help you today?`,
        sender_id: resolvedDoctorId,
        is_ai_generated: false,
        created_at: new Date().toISOString(),
      }]);
    }

    setInitialized(true);

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${convId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${convId}`,
      }, (payload) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as Message];
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const send = async () => {
    if (!text.trim() || !user) return;
    const content = text.trim();
    setText("");
    setSending(true);

    const patientMsg: Message = {
      id: crypto.randomUUID(),
      content,
      sender_id: user.id,
      is_ai_generated: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, patientMsg]);

    if (isAvailable && conversationId) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        is_ai_generated: false,
      });
    } else {
      // AI fallback
      const history = messages.map((m) => ({
        role: m.sender_id === user.id ? "user" : "assistant",
        content: m.content,
      }));
      try {
        const { data, error } = await supabase.functions.invoke("chat-agent", {
          body: {
            doctorId: doctorSupabaseId ?? doctorId,
            patientId: user.id,
            conversationHistory: history,
            patientMessage: content,
          },
        });
        const aiContent = error
          ? `Thank you for reaching out. Dr. ${doctorName} will get back to you when available.`
          : (data?.reply ?? "Your message has been noted. The doctor will respond shortly.");

        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          content: aiContent,
          sender_id: doctorSupabaseId ?? doctorId,
          is_ai_generated: true,
          created_at: new Date().toISOString(),
        }]);
      } catch {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          content: `Message received. Dr. ${doctorName} will respond when next available.`,
          sender_id: doctorSupabaseId ?? doctorId,
          is_ai_generated: true,
          created_at: new Date().toISOString(),
        }]);
      }
    }

    setSending(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <Link
          to="/doctor/$id"
          params={{ id: doctorId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        <Card className="mt-4 flex flex-1 flex-col overflow-hidden border-border/60 shadow-elegant">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-card p-4">
            <div
              className="grid h-11 w-11 place-items-center rounded-xl text-sm font-semibold text-primary-foreground"
              style={{ backgroundColor: doctorColor }}
            >
              {doctorInitials}
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold">{doctorName}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Stethoscope className="h-3 w-3" /> {doctorSpecialty}
                <span className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ backgroundColor: isAvailable ? "oklch(0.68 0.15 155 / 0.15)" : "oklch(0.5 0 0 / 0.1)" }}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-success animate-pulse" : "bg-muted-foreground/50"}`} />
                  <span className={isAvailable ? "text-success" : "text-muted-foreground"}>
                    {isAvailable ? "Online" : "AI assistant active"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 space-y-3 overflow-y-auto bg-gradient-soft p-4"
            style={{ minHeight: 360, maxHeight: "60vh" }}
          >
            {messages.map((m) => (
              <Bubble key={m.id} msg={m} userId={user?.id ?? ""} doctorColor={doctorColor} doctorInitials={doctorInitials} />
            ))}
            {sending && !isAvailable && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> AI is typing…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <div className="flex items-center gap-2 border-t border-border/60 bg-card p-3">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={isAvailable ? "Message the doctor…" : "Leave a message — AI will assist you"}
              className="h-11"
              disabled={sending}
            />
            <Button onClick={send} className="h-11 shadow-elegant" disabled={!text.trim() || sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Bubble({ msg, userId, doctorColor, doctorInitials }: {
  msg: Message; userId: string; doctorColor: string; doctorInitials: string;
}) {
  if (msg.is_ai_generated) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-ai/20 bg-ai/5 p-3 text-sm text-ai">
        <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
          <Sparkles className="h-3 w-3" /> AI Assistant
        </div>
        <div className="text-foreground">{msg.content}</div>
      </div>
    );
  }
  const isPatient = msg.sender_id === userId;
  return (
    <div className={`flex items-end gap-2 ${isPatient ? "justify-end" : "justify-start"}`}>
      {!isPatient && (
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold text-primary-foreground"
          style={{ backgroundColor: doctorColor }}
        >
          {doctorInitials}
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-soft ${isPatient ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card"}`}>
        {msg.content}
      </div>
    </div>
  );
}

