import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Lightbulb, Target, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Idea {
  id: string;
  title: string;
  problem_statement: string | null;
  target_user: string | null;
  market_pain: string | null;
  risks: string[];
  validation_score: number | null;
  validation_reasoning: string | null;
  status: string;
  created_at: string;
}

export default function Ideas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: "",
    problem_statement: "",
    target_user: "",
    market_pain: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) loadIdeas();
  }, [user]);

  const loadIdeas = async () => {
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading ideas", variant: "destructive" });
    } else {
      setIdeas(data || []);
    }
    setIsLoading(false);
  };

  const handleCreateIdea = async () => {
    if (!newIdea.title.trim()) return;

    const { data, error } = await supabase
      .from("ideas")
      .insert({
        user_id: user!.id,
        title: newIdea.title,
        problem_statement: newIdea.problem_statement || null,
        target_user: newIdea.target_user || null,
        market_pain: newIdea.market_pain || null,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to create idea", variant: "destructive" });
    } else {
      setIdeas([data, ...ideas]);
      setNewIdea({ title: "", problem_statement: "", target_user: "", market_pain: "" });
      setIsDialogOpen(false);
      toast({ title: "Idea created", description: "Ready for validation" });
    }
  };

  const handleValidateIdea = async (idea: Idea) => {
    setIsValidating(true);

    try {
      // Update status to validating
      await supabase
        .from("ideas")
        .update({ status: "validating" })
        .eq("id", idea.id);

      // Call AI for validation
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/co-founder-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Please validate this startup idea and provide a validation score (0-100):

Title: ${idea.title}
Problem Statement: ${idea.problem_statement || "Not specified"}
Target User: ${idea.target_user || "Not specified"}
Market Pain: ${idea.market_pain || "Not specified"}

Analyze:
1. Problem clarity (is it well-defined?)
2. Target user specificity
3. Market pain intensity
4. Key risks and assumptions
5. Suggested niche focus

End with: "VALIDATION_SCORE: [number]" where number is 0-100.`,
              },
            ],
            contextType: "idea_validation",
            userContext: "",
            conversationContext: "",
          }),
        }
      );

      if (!response.ok) throw new Error("Validation failed");

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

      // Extract score from response
      const scoreMatch = fullResponse.match(/VALIDATION_SCORE:\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

      // Update idea with validation results
      await supabase
        .from("ideas")
        .update({
          validation_score: score,
          validation_reasoning: fullResponse.replace(/VALIDATION_SCORE:\s*\d+/i, "").trim(),
          status: "validated",
        })
        .eq("id", idea.id);

      loadIdeas();
      toast({ title: "Idea validated", description: `Score: ${score || "N/A"}/100` });
    } catch (error) {
      console.error(error);
      toast({ title: "Validation failed", variant: "destructive" });
      await supabase.from("ideas").update({ status: "draft" }).eq("id", idea.id);
    } finally {
      setIsValidating(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 70) return "text-score-high";
    if (score >= 40) return "text-score-medium";
    return "text-score-low";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Ideas</h1>
            <p className="text-muted-foreground mt-1">
              Validate your startup ideas with honest AI feedback
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Idea
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Submit a new idea</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Idea Title</Label>
                  <Input
                    id="title"
                    value={newIdea.title}
                    onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                    placeholder="e.g., AI resume builder for developers"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="problem">Problem Statement</Label>
                  <Textarea
                    id="problem"
                    value={newIdea.problem_statement}
                    onChange={(e) => setNewIdea({ ...newIdea, problem_statement: e.target.value })}
                    placeholder="What specific problem does this solve?"
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="target">Target User</Label>
                  <Input
                    id="target"
                    value={newIdea.target_user}
                    onChange={(e) => setNewIdea({ ...newIdea, target_user: e.target.value })}
                    placeholder="Who exactly is this for?"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="pain">Market Pain</Label>
                  <Textarea
                    id="pain"
                    value={newIdea.market_pain}
                    onChange={(e) => setNewIdea({ ...newIdea, market_pain: e.target.value })}
                    placeholder="How painful is this problem? Evidence?"
                    className="mt-1.5"
                    rows={2}
                  />
                </div>
                <Button onClick={handleCreateIdea} className="w-full" disabled={!newIdea.title.trim()}>
                  Create Idea
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No ideas yet</h3>
            <p className="text-muted-foreground mt-1">Submit your first startup idea to get validated</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="glass-card rounded-xl p-6 animate-fade-in"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-foreground">{idea.title}</h3>
                      {idea.validation_score !== null && (
                        <span
                          className={cn(
                            "text-2xl font-bold",
                            getScoreColor(idea.validation_score)
                          )}
                        >
                          {idea.validation_score}
                        </span>
                      )}
                    </div>

                    {idea.problem_statement && (
                      <p className="text-muted-foreground mt-2 text-sm">{idea.problem_statement}</p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      {idea.target_user && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Target className="w-4 h-4" />
                          <span>{idea.target_user}</span>
                        </div>
                      )}
                      {idea.risks && idea.risks.length > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{idea.risks.length} risks identified</span>
                        </div>
                      )}
                    </div>

                    {idea.validation_reasoning && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {idea.validation_reasoning.slice(0, 500)}
                          {idea.validation_reasoning.length > 500 && "..."}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {idea.status !== "validated" && (
                      <Button
                        onClick={() => handleValidateIdea(idea)}
                        disabled={isValidating}
                        size="sm"
                        variant="secondary"
                      >
                        {isValidating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Validate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
