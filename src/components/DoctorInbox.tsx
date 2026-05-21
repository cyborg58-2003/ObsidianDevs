import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { MessageSquare, Send, Loader2, User2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  patient_id: string;
  created_at: string;
  last_message_at: string | null;
  patient_name?: string;
  patient_avatar?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  is_ai_generated: boolean;
  created_at: string;
}

export function DoctorInbox({ doctorId, userId }: { doctorId: string; userId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  
  const endRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("conversations")
        .select(`
          *,
          profiles!conversations_patient_id_fkey(name, avatar_url)
        `)
        .eq("doctor_id", doctorId)
        .order("last_message_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching conversations:", error);
      } else if (data) {
        const formatted = data.map((d: any) => ({
          ...d,
          patient_name: d.profiles?.name || "Unknown Patient",
          patient_avatar: d.profiles?.avatar_url,
        }));
        setConversations(formatted);
      }
      setLoading(false);
    };

    fetchConversations();
  }, [doctorId]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!activeConv) return;
    
    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConv.id)
        .order("created_at", { ascending: true });
        
      if (data) setMessages(data as Message[]);
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`doc_msgs_${activeConv.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConv.id}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConv]);

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeConv) return;
    
    setSending(true);
    const content = text.trim();
    setText("");
    
    const { error } = await (supabase as any).from("messages").insert({
      conversation_id: activeConv.id,
      sender_id: userId || doctorId,
      content,
      is_ai_generated: false,
    });
    
    if (error) {
      toast.error("Failed to send message");
      setText(content); // restore text
    } else {
      // update conversation last_message_at
      await (supabase as any)
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeConv.id);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <Card className="flex h-[500px] items-center justify-center border-border/60 shadow-soft">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading messages...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-[600px] overflow-hidden border-border/60 shadow-soft">
      {/* Left sidebar: Conversations */}
      <div className="w-1/3 border-r border-border/60 bg-muted/10 flex flex-col">
        <div className="p-4 border-b border-border/60 bg-card">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Inbox
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground mt-10">
              No messages yet
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3",
                  activeConv?.id === conv.id 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "hover:bg-muted"
                )}
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-secondary grid place-items-center overflow-hidden">
                  {conv.patient_avatar ? (
                    <img src={conv.patient_avatar} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User2 className={cn("h-5 w-5", activeConv?.id === conv.id ? "text-primary-foreground/80" : "text-muted-foreground")} />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium truncate text-sm">{conv.patient_name}</p>
                  <p className={cn("text-xs truncate", activeConv?.id === conv.id ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : "New"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Active Chat */}
      <div className="flex-1 flex flex-col bg-card">
        {activeConv ? (
          <>
            <div className="p-4 border-b border-border/60 bg-gradient-card">
              <h3 className="font-semibold">{activeConv.patient_name}</h3>
              <p className="text-xs text-muted-foreground">Patient Chat</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Start of conversation
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === doctorId || (!!userId && msg.sender_id === userId);
                  return (
                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-sm shadow-elegant"
                            : "bg-muted text-foreground rounded-bl-sm"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>
            
            <div className="p-4 border-t border-border/60 bg-background/50">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 bg-card"
                  disabled={sending}
                />
                <Button type="submit" disabled={!text.trim() || sending} className="shadow-elegant">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </Card>
  );
}
