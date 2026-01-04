import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Sparkles, User } from "lucide-react";
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
    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    // Fetch recent ideas
    const { data: ideas } = await supabase
      .from("ideas")
      .select("title, status, validation_score")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch recent decisions
    const { data: decisions } = await supabase
      .from("decisions")
      .select("title, chosen_option, confidence_level")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch recent metrics
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
    // Get recent messages for context
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

    // Save user message
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

      // Handle streaming response
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

      // Save assistant message
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
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Start a conversation</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Share your idea, challenge, or question. I'll give you direct, honest feedback focused on execution.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-3 animate-fade-in",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="bg-muted rounded-2xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind?"
            className="min-h-[48px] max-h-[120px] resize-none bg-muted border-border focus:border-primary"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
