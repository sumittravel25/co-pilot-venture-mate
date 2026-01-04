import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Sparkles, Calendar, AlertTriangle } from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

interface WeeklyReview {
  id: string;
  week_start: string;
  week_end: string;
  what_worked: string | null;
  what_didnt_work: string | null;
  key_learnings: string | null;
  next_priorities: string | null;
  hard_truth: string | null;
  generated_at: string;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) loadReviews();
  }, [user]);

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from("weekly_reviews")
      .select("*")
      .eq("user_id", user!.id)
      .order("week_start", { ascending: false });

    if (error) {
      toast({ title: "Error loading reviews", variant: "destructive" });
    } else {
      setReviews(data || []);
    }
    setIsLoading(false);
  };

  const generateWeeklyReview = async () => {
    setIsGenerating(true);

    try {
      const now = new Date();
      const weekStart = startOfWeek(subWeeks(now, 1));
      const weekEnd = endOfWeek(subWeeks(now, 1));

      // Get recent data for context
      const [{ data: recentDecisions }, { data: recentMetrics }, { data: recentMessages }] =
        await Promise.all([
          supabase
            .from("decisions")
            .select("*")
            .eq("user_id", user!.id)
            .gte("created_at", weekStart.toISOString())
            .lte("created_at", weekEnd.toISOString()),
          supabase
            .from("metrics")
            .select("*")
            .eq("user_id", user!.id)
            .gte("recorded_at", weekStart.toISOString())
            .lte("recorded_at", weekEnd.toISOString()),
          supabase
            .from("chat_messages")
            .select("*")
            .eq("user_id", user!.id)
            .gte("created_at", weekStart.toISOString())
            .lte("created_at", weekEnd.toISOString())
            .limit(20),
        ]);

      const contextPrompt = `Generate a weekly co-founder review for the week of ${format(
        weekStart,
        "MMM d"
      )} - ${format(weekEnd, "MMM d, yyyy")}.

Based on this week's activity:
- Decisions made: ${JSON.stringify(recentDecisions || [])}
- Metrics logged: ${JSON.stringify(recentMetrics || [])}
- Recent discussions: ${recentMessages?.map((m) => m.content).join("\n") || "None"}

Provide:
1. WHAT_WORKED: What moved the business forward this week
2. WHAT_DIDNT_WORK: What didn't work or stalled
3. KEY_LEARNINGS: Most important insights
4. NEXT_PRIORITIES: Focus areas for next week
5. HARD_TRUTH: One uncomfortable but important observation

Be direct and specific. No generic advice. Format each section clearly with the label.`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/co-founder-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: contextPrompt }],
            contextType: "review",
            userContext: "",
            conversationContext: "",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate review");

      // Parse streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
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
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullResponse += content;
            } catch {
              // Continue
            }
          }
        }
      }

      // Parse sections from response
      const extractSection = (text: string, label: string): string => {
        const regex = new RegExp(`${label}[:\\s]*([\\s\\S]*?)(?=(?:WHAT_WORKED|WHAT_DIDNT_WORK|KEY_LEARNINGS|NEXT_PRIORITIES|HARD_TRUTH)|$)`, "i");
        const match = text.match(regex);
        return match ? match[1].trim() : "";
      };

      const { data, error } = await supabase
        .from("weekly_reviews")
        .insert({
          user_id: user!.id,
          week_start: format(weekStart, "yyyy-MM-dd"),
          week_end: format(weekEnd, "yyyy-MM-dd"),
          what_worked: extractSection(fullResponse, "WHAT_WORKED") || null,
          what_didnt_work: extractSection(fullResponse, "WHAT_DIDNT_WORK") || null,
          key_learnings: extractSection(fullResponse, "KEY_LEARNINGS") || null,
          next_priorities: extractSection(fullResponse, "NEXT_PRIORITIES") || null,
          hard_truth: extractSection(fullResponse, "HARD_TRUTH") || null,
          generated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setReviews([data, ...reviews]);
      toast({ title: "Weekly review generated" });
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to generate review", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Weekly Reviews</h1>
            <p className="text-muted-foreground mt-1">
              AI-generated insights on your progress
            </p>
          </div>
          <Button onClick={generateWeeklyReview} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Review
          </Button>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No reviews yet</h3>
            <p className="text-muted-foreground mt-1">Generate your first weekly review</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="glass-card rounded-2xl p-6 animate-fade-in">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Week of {format(new Date(review.week_start), "MMM d")} -{" "}
                    {format(new Date(review.week_end), "MMM d, yyyy")}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {review.what_worked && (
                    <div>
                      <h4 className="text-sm font-medium text-score-high mb-2">What Worked</h4>
                      <p className="text-sm text-foreground">{review.what_worked}</p>
                    </div>
                  )}

                  {review.what_didnt_work && (
                    <div>
                      <h4 className="text-sm font-medium text-score-low mb-2">What Didn't Work</h4>
                      <p className="text-sm text-foreground">{review.what_didnt_work}</p>
                    </div>
                  )}

                  {review.key_learnings && (
                    <div>
                      <h4 className="text-sm font-medium text-primary mb-2">Key Learnings</h4>
                      <p className="text-sm text-foreground">{review.key_learnings}</p>
                    </div>
                  )}

                  {review.next_priorities && (
                    <div>
                      <h4 className="text-sm font-medium text-info mb-2">Next Priorities</h4>
                      <p className="text-sm text-foreground">{review.next_priorities}</p>
                    </div>
                  )}
                </div>

                {review.hard_truth && (
                  <div className="mt-6 p-4 bg-score-low/10 border border-score-low/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-score-low" />
                      <h4 className="text-sm font-medium text-score-low">Hard Truth</h4>
                    </div>
                    <p className="text-sm text-foreground">{review.hard_truth}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
