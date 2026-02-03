import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Sparkles, User, Lightbulb, Target, TrendingUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  contextType?: "general" | "idea_validation" | "mvp_planning" | "decision" | "metrics" | "review";
  contextId?: string;
  initialMessage?: string;
  onMessageSent?: () => void;
}

const quickPrompts = [
  { icon: Lightbulb, label: "Validate my idea", prompt: "Can you help me validate my startup idea?" },
  { icon: Target, label: "Plan MVP", prompt: "Help me plan an MVP for my project" },
  { icon: TrendingUp, label: "Growth strategy", prompt: "What growth strategies should I focus on?" },
  { icon: HelpCircle, label: "Ask anything", prompt: "I need advice on..." },
];

export function ChatInterface({
  contextType = "general",
  contextId,
  initialMessage,
  onMessageSent,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load chat history
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user, contextType, contextId]);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && messages.length === 0 && !isLoading) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    let query = supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true });

    if (contextType !== "general") {
      query = query.eq("context_type", contextType);
    }
    if (contextId) {
      query = query.eq("context_id", contextId);
    }

    const { data } = await query.limit(50);
    if (data) {
      setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
    }
  };

  const getUserContext = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    const { data: ideas } = await supabase
      .from("ideas")
      .select("title, status, validation_score")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: decisions } = await supabase
      .from("decisions")
      .select("title, chosen_option, confidence_level")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: metrics } = await supabase
      .from("metrics")
      .select("metric_type, value, recorded_at")
      .eq("user_id", user!.id)
      .order("recorded_at", { ascending: false })
      .limit(10);

    return JSON.stringify({
      profile: profile || {},
      recentIdeas: ideas || [],
      recentDecisions: decisions || [],
      recentMetrics: metrics || [],
    });
  };

  const getConversationContext = async () => {
    const { data: recentMessages } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return recentMessages
      ? recentMessages
          .reverse()
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")
      : "";
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    await supabase.from("chat_messages").insert({
      user_id: user!.id,
      role: "user",
      content: text,
      context_type: contextType,
      context_id: contextId,
    });

    try {
      const [userContext, conversationContext] = await Promise.all([
        getUserContext(),
        getConversationContext(),
      ]);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/co-founder-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            userContext,
            conversationContext,
            contextType,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return prev.map((m, i) =>
                      i === prev.length - 1 ? { ...m, content: assistantContent } : m
                    );
                  }
                  return [...prev, { role: "assistant", content: assistantContent }];
                });
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }

      if (assistantContent) {
        await supabase.from("chat_messages").insert({
          user_id: user!.id,
          role: "assistant",
          content: assistantContent,
          context_type: contextType,
          context_id: contextId,
        });
      }

      onMessageSent?.();
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Message failed",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background via-background to-muted/20">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              {/* AI Avatar with glow */}
              <div className="relative inline-flex mb-6">
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-150" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
              </div>
              
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                Your AI Co-Founder
              </h3>
              <p className="text-muted-foreground text-base max-w-md mx-auto mb-8">
                Direct, honest feedback focused on execution. No fluff, just actionable insights for your startup journey.
              </p>

              {/* Quick prompts */}
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/30 text-sm text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <item.icon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3 animate-slide-up",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {message.role === "assistant" && (
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-primary/20 blur-lg rounded-xl" />
                  <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                  message.role === "user"
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                    : "glass-card"
                )}
              >
                <p className={cn(
                  "text-sm leading-relaxed whitespace-pre-wrap",
                  message.role === "assistant" && "text-foreground"
                )}>
                  {message.content}
                </p>
              </div>
              
              {message.role === "user" && (
                <div className="w-9 h-9 rounded-xl bg-secondary border border-border/50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Enhanced typing indicator */}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3 animate-fade-in">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-xl animate-pulse" />
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </div>
              </div>
              <div className="glass-card rounded-2xl px-5 py-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your startup..."
                className="min-h-[52px] max-h-[160px] resize-none pr-4 py-3.5 bg-secondary/50 border-border/50 rounded-xl focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-foreground"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[52px] w-[52px] rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-primary/30 hover:scale-[1.02]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/50 text-center mt-3">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
