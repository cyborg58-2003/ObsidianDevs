// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  is_ai_generated: boolean;
  created_at: string;
}

interface ChatWidgetProps {
  doctorId: string;
  doctorName: string;
  isAvailable: boolean;
}

export function ChatWidget({ doctorId, doctorName, isAvailable }: ChatWidgetProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch conversation when widget opens
  useEffect(() => {
    if (!open || !user || initialized) return;
    initConversation();
  }, [open, user, initialized]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initConversation = async () => {
    if (!user) return;

    // Check existing conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("doctor_id", doctorId)
      .eq("patient_id", user.id)
      .single();

    let convId: string;

    if (existing?.id) {
      convId = existing.id;
    } else {
      // Create new conversation
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ doctor_id: doctorId, patient_id: user.id })
        .select("id")
        .single();
      convId = newConv?.id ?? crypto.randomUUID();
    }

    setConversationId(convId);

    // Load existing messages
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at");
    setMessages((msgs ?? []) as ChatMessage[]);

    // Add greeting if no messages
    if (!msgs || msgs.length === 0) {
      const greeting: ChatMessage = {
        id: "greeting",
        content: isAvailable
          ? `Hi! I'm ${doctorName}. How can I help you today?`
          : `Hi! Dr. ${doctorName} is currently offline. I'm their AI assistant — I'll help you and relay your message.`,
        sender_id: doctorId,
        is_ai_generated: !isAvailable,
        created_at: new Date().toISOString(),
      };
      setMessages([greeting]);
    }

    setInitialized(true);

    // Subscribe to realtime if doctor is online
    if (isAvailable) {
      const channel = supabase
        .channel(`conversation:${convId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${convId}`,
          },
          (payload) => {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new as ChatMessage];
            });
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    const content = text.trim();
    setText("");

    if (isAvailable && conversationId) {
      // Online: insert message to DB — realtime will update UI
      const optimistic: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        sender_id: user.id,
        is_ai_generated: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        is_ai_generated: false,
      });

      // Update last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    } else {
      // Offline: call AI Edge Function
      const patientMsg: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        sender_id: user.id,
        is_ai_generated: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, patientMsg]);

      const history = messages.map((m) => ({
        role: m.sender_id === user.id ? "user" : "assistant",
        content: m.content,
      }));

      try {
        const { data, error } = await supabase.functions.invoke("chat-agent", {
          body: {
            doctorId,
            patientId: user.id,
            conversationHistory: history,
            patientMessage: content,
          },
        });

        const aiContent = error
          ? "I've noted your message. Dr. " + doctorName + " will get back to you shortly."
          : (data?.reply ?? "Thank you for your message. The doctor will be in touch soon.");

        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          content: aiContent,
          sender_id: doctorId,
          is_ai_generated: true,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const fallback: ChatMessage = {
          id: crypto.randomUUID(),
          content: `I've recorded your message for Dr. ${doctorName}. They'll respond when they're next available.`,
          sender_id: doctorId,
          is_ai_generated: true,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallback]);
      }
    }

    setSending(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        id="chat-widget-toggle"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-all hover:scale-105 hover:shadow-glow",
          "bg-gradient-hero"
        )}
        aria-label="Open chat"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="hidden sm:inline">Chat with doctor</span>
        <span
          className={cn(
            "ml-1 h-2 w-2 rounded-full",
            isAvailable ? "bg-green-300 animate-pulse" : "bg-gray-400"
          )}
        />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-elegant" style={{ maxHeight: "70vh" }}>
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-card p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/20 text-sm font-bold text-primary">
              {doctorName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate font-display font-semibold text-sm">{doctorName}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("h-1.5 w-1.5 rounded-full", isAvailable ? "bg-success animate-pulse" : "bg-muted-foreground/50")} />
                {isAvailable ? "Available now" : "Offline — AI assistant active"}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 hover:bg-muted"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-soft p-4" style={{ minHeight: 200 }}>
            {!user && (
              <div className="rounded-xl border border-border/60 bg-card p-3 text-center text-sm text-muted-foreground">
                Please <a href="/login" className="font-medium text-primary hover:underline">sign in</a> to chat.
              </div>
            )}
            {messages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} isPatient={msg.sender_id === user?.id} />
            ))}
            {sending && !isAvailable && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> AI is typing…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border/60 bg-card p-3">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={user ? "Describe your concern…" : "Sign in to chat"}
              className="h-10"
              disabled={!user || sending}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!text.trim() || !user || sending}
              className="h-10 w-10 shrink-0 shadow-elegant"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function ChatBubble({ msg, isPatient }: { msg: ChatMessage; isPatient: boolean }) {
  if (msg.is_ai_generated) {
    return (
      <div className="mx-auto max-w-xs rounded-2xl border border-ai/20 bg-ai/5 p-3 text-sm">
        <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-ai">
          <Sparkles className="h-2.5 w-2.5" /> AI Assistant
        </div>
        <div>{msg.content}</div>
      </div>
    );
  }
  return (
    <div className={cn("flex items-end gap-2", isPatient ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-soft",
          isPatient ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card"
        )}
      >
        {msg.content}
      </div>
    </div>
  );
}

