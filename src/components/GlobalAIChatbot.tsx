// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import {
  MessageSquare, X, Send, Sparkles, Loader2,
  ChevronDown, Bot, User2, Phone, Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "I have chest pain",
  "My child has a fever",
  "I need a skin checkup",
  "I've been feeling anxious",
];

const GREETING = `👋 Hi! I'm the Smart Doctor AI assistant.

Describe your symptoms or health concern and I'll:
• Suggest the right specialist for you
• Help you find available doctors
• Answer general health questions

What's bothering you today?`;

/**
 * GlobalAIChatbot — a floating AI assistant that appears on every page.
 * When the user describes symptoms, it calls the `symptom-match` Edge Function
 * (with graceful local fallback) and suggests relevant doctors.
 */
export function GlobalAIChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: "greeting",
      role: "assistant",
      content: GREETING,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [suggestedDoctors, setSuggestedDoctors] = useState<
    Array<{ name: string; specialty: string; city: string; id: string }>
  >([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role: "user" | "assistant", content: string) => {
    const msg: AiMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    if (!open && role === "assistant") setUnread((n) => n + 1);
    return msg;
  };

  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput("");
    setLoading(true);
    setSuggestedDoctors([]);

    addMessage("user", userText);

    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let reply = "";
    let doctors: typeof suggestedDoctors = [];

    try {
      // Try the symptom-match Edge Function first
      const { data, error } = await supabase.functions.invoke("symptom-match", {
        body: {
          symptom: userText,
          conversationHistory: history,
          userId: user?.id ?? null,
        },
      });

      if (!error && data) {
        reply = data.reply ?? data.message ?? "";
        if (data.suggestedSpecialty) {
          // Fetch matching doctors from DB
          const { data: dbDoctors } = await supabase
            .from("doctors")
            .select(
              "id, specialization, profiles!doctors_user_id_fkey(name, city)"
            )
            .ilike("specialization", `%${data.suggestedSpecialty}%`)
            .eq("is_available", true)
            .limit(3);

          if (dbDoctors && dbDoctors.length > 0) {
            doctors = dbDoctors.map((d: any) => ({
              id: d.id,
              name: d.profiles?.name ?? "Doctor",
              specialty: d.specialization ?? data.suggestedSpecialty,
              city: d.profiles?.city ?? "Pakistan",
            }));
          } else {
            // Fallback to mock data doctors for the specialty
            reply +=
              `\n\nI recommend consulting a **${data.suggestedSpecialty}**. ` +
              `You can search for available doctors on our platform.`;
          }
        }
      }
    } catch {
      reply = "";
    }

    // Local fallback AI response if Edge Function fails or returns empty
    if (!reply) {
      reply = await localSymptomFallback(userText);
    }

    setLoading(false);
    addMessage("assistant", reply);
    if (doctors.length > 0) setSuggestedDoctors(doctors);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        id="global-ai-chat-toggle"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105",
          "bg-gradient-to-br from-primary to-ai",
          open && "scale-95 opacity-80"
        )}
        aria-label="Open AI health assistant"
      >
        <Bot className="h-5 w-5" />
        <span className="hidden sm:inline">AI Assistant</span>
        {unread > 0 && !open && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
            {unread}
          </span>
        )}
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
        </span>
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl",
            "w-[380px] max-w-[calc(100vw-3rem)]",
            "transition-all duration-300 ease-out"
          )}
          style={{ maxHeight: "calc(100vh - 8rem)", minHeight: 480 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-primary to-ai p-4 text-white">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold">Smart Doctor AI</div>
              <div className="flex items-center gap-1.5 text-xs text-white/80">
                <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-green-300" />
                AI assistant · Always online
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 hover:bg-white/20 transition-colors"
              aria-label="Close AI chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 space-y-4 overflow-y-auto bg-gradient-soft p-4"
            style={{ minHeight: 240 }}
          >
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-ai text-white text-xs">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-card px-3.5 py-2.5 shadow-soft">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            )}

            {/* Suggested doctors */}
            {suggestedDoctors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Available now
                </p>
                {suggestedDoctors.map((d) => (
                  <a
                    key={d.id}
                    href={`/doctor/${d.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 text-sm shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                      {d.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-semibold">{d.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Stethoscope className="h-3 w-3" />
                        {d.specialty} · {d.city}
                      </div>
                    </div>
                    <Badge className="bg-success/15 text-success text-xs">
                      Book
                    </Badge>
                  </a>
                ))}
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Suggested prompts (show only at start) */}
          {messages.length <= 1 && (
            <div className="border-t border-border/60 bg-secondary/30 px-4 py-3">
              <p className="mb-2 text-xs text-muted-foreground">Quick questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="flex items-center gap-2 border-t border-border/60 bg-card p-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your symptoms…"
              className="h-11 rounded-xl"
              disabled={loading}
            />
            <Button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="h-11 w-11 shrink-0 rounded-xl p-0"
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Footer disclaimer */}
          <div className="bg-secondary/30 px-4 py-2 text-center text-[10px] text-muted-foreground">
            AI assistant · Not a substitute for professional medical advice
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ msg }: { msg: AiMessage }) {
  const isUser = msg.role === "user";

  // Simple markdown-like rendering for **bold** and newlines
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\n)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part === "\n") return <br key={i} />;
      return part;
    });
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-ai text-white text-xs mb-1">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-soft",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-card text-foreground"
        )}
      >
        {renderContent(msg.content)}
        <div
          className={cn(
            "mt-1 text-[10px]",
            isUser ? "text-primary-foreground/60 text-right" : "text-muted-foreground"
          )}
        >
          {msg.timestamp.toLocaleTimeString("en-PK", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      {isUser && (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground mb-1">
          <User2 className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}

/**
 * Local symptom-to-specialty fallback used when the Edge Function is unavailable.
 */
async function localSymptomFallback(symptom: string): Promise<string> {
  const s = symptom.toLowerCase();

  const map: Array<[string[], string, string]> = [
    [["chest", "heart", "palpitation", "cardiac"], "Cardiologist", "chest-related concerns"],
    [["skin", "rash", "acne", "eczema", "dermat"], "Dermatologist", "skin conditions"],
    [["child", "baby", "infant", "pediatric", "fever in kid"], "Pediatrician", "child health"],
    [["bone", "joint", "knee", "back pain", "fracture", "spine"], "Orthopedist", "bone and joint issues"],
    [["headache", "migraine", "brain", "neuro", "dizziness", "epilepsy"], "Neurologist", "neurological symptoms"],
    [["anxiety", "depressed", "stress", "mental", "sleep", "adhd"], "Psychiatrist", "mental health concerns"],
    [["pregnant", "period", "women", "gynec", "uterus", "ovary"], "Gynecologist", "women's health"],
    [["ear", "nose", "throat", "sinus", "hearing", "ent"], "ENT Specialist", "ear, nose, and throat issues"],
    [["teeth", "dental", "tooth", "gum", "mouth"], "Dentist", "dental health"],
  ];

  for (const [keywords, specialty, context] of map) {
    if (keywords.some((k) => s.includes(k))) {
      return (
        `Based on your symptoms, I'd recommend consulting a **${specialty}** for ${context}.\n\n` +
        `Would you like me to:\n` +
        `• Show available ${specialty}s near you?\n` +
        `• Filter by city or consultation type?\n\n` +
        `You can also use our search page to browse all available doctors.`
      );
    }
  }

  return (
    `Thanks for sharing. To give you the best recommendation, could you tell me more about your symptoms?\n\n` +
    `For example:\n` +
    `• Where exactly is the discomfort?\n` +
    `• How long have you had it?\n` +
    `• Any other symptoms?\n\n` +
    `Or you can browse all doctors on our **search page**.`
  );
}
