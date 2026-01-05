import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Map, Loader2, Sparkles, CheckCircle2, Circle, ChevronRight, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface Idea {
  id: string;
  title: string;
  status: string;
  validation_score: number | null;
}

interface Roadmap {
  id: string;
  idea_id: string;
  mvp_scope: string | null;
  tech_stack: string[];
  estimated_build_time: string | null;
  first_user_path: string | null;
}

interface RoadmapStep {
  id: string;
  roadmap_id: string;
  step_number: number;
  title: string;
  description: string | null;
  completed: boolean;
}

export default function Roadmap() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) loadIdeas();
  }, [user]);

  useEffect(() => {
    if (selectedIdeaId) loadRoadmap(selectedIdeaId);
  }, [selectedIdeaId]);

  const loadIdeas = async () => {
    const { data } = await supabase
      .from("ideas")
      .select("id, title, status, validation_score")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    setIdeas(data || []);
    if (data && data.length > 0) {
      setSelectedIdeaId(data[0].id);
    }
    setIsLoading(false);
  };

  const loadRoadmap = async (ideaId: string) => {
    const { data: roadmapData } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("idea_id", ideaId)
      .single();

    setRoadmap(roadmapData);

    if (roadmapData) {
      const { data: stepsData } = await supabase
        .from("roadmap_steps")
        .select("*")
        .eq("roadmap_id", roadmapData.id)
        .order("step_number", { ascending: true });

      setSteps(stepsData || []);
    } else {
      setSteps([]);
    }
  };

  const generateRoadmap = async () => {
    if (!selectedIdeaId) return;

    const selectedIdea = ideas.find((i) => i.id === selectedIdeaId);
    if (!selectedIdea) return;

    setIsGenerating(true);

    try {
      // Get idea details
      const { data: ideaData } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", selectedIdeaId)
        .single();

      const prompt = `Create an MVP roadmap for this startup idea:

Title: ${ideaData?.title}
Problem: ${ideaData?.problem_statement || "Not specified"}
Target User: ${ideaData?.target_user || "Not specified"}
Validation Score: ${ideaData?.validation_score || "Not yet validated"}

Provide:
1. MVP_SCOPE: Clear, focused MVP scope (2-3 sentences)
2. TECH_STACK: Recommended tech/no-code stack (comma-separated list)
3. BUILD_TIME: Estimated time to build (e.g., "2-3 weeks")
4. FIRST_USER_PATH: Fastest path to first user (1-2 sentences)
5. STEPS: Numbered actionable steps (format: "1. Step title | Step description")

Be specific and practical. Focus on speed to market.`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/co-founder-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            contextType: "mvp_planning",
            userContext: "",
            conversationContext: "",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate roadmap");

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

      // Parse sections
      const extractSection = (text: string, label: string): string => {
        const regex = new RegExp(`${label}[:\\s]*([\\s\\S]*?)(?=(?:MVP_SCOPE|TECH_STACK|BUILD_TIME|FIRST_USER_PATH|STEPS)|$)`, "i");
        const match = text.match(regex);
        return match ? match[1].trim() : "";
      };

      const techStackStr = extractSection(fullResponse, "TECH_STACK");
      const techStack = techStackStr.split(",").map((s) => s.trim()).filter(Boolean);

      // Create roadmap
      const { data: newRoadmap, error: roadmapError } = await supabase
        .from("roadmaps")
        .insert({
          idea_id: selectedIdeaId,
          user_id: user!.id,
          mvp_scope: extractSection(fullResponse, "MVP_SCOPE") || null,
          tech_stack: techStack,
          estimated_build_time: extractSection(fullResponse, "BUILD_TIME") || null,
          first_user_path: extractSection(fullResponse, "FIRST_USER_PATH") || null,
        })
        .select()
        .single();

      if (roadmapError) throw roadmapError;

      // Parse and create steps
      const stepsStr = extractSection(fullResponse, "STEPS");
      const stepLines = stepsStr.split("\n").filter((line) => /^\d+\./.test(line.trim()));
      
      const stepsToInsert = stepLines.map((line, index) => {
        const match = line.match(/^\d+\.\s*([^|]+)\|?\s*(.*)?/);
        return {
          roadmap_id: newRoadmap.id,
          step_number: index + 1,
          title: match ? match[1].trim() : line.replace(/^\d+\.\s*/, "").trim(),
          description: match && match[2] ? match[2].trim() : null,
          completed: false,
        };
      });

      if (stepsToInsert.length > 0) {
        await supabase.from("roadmap_steps").insert(stepsToInsert);
      }

      await loadRoadmap(selectedIdeaId);
      toast({ title: "Roadmap generated" });
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to generate roadmap", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStepComplete = async (stepId: string, completed: boolean) => {
    await supabase
      .from("roadmap_steps")
      .update({ 
        completed: !completed,
        completed_at: !completed ? new Date().toISOString() : null
      })
      .eq("id", stepId);

    setSteps(steps.map((s) => (s.id === stepId ? { ...s, completed: !completed } : s)));
  };

  const completedSteps = steps.filter((s) => s.completed).length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">MVP Roadmap</h1>
            <p className="text-muted-foreground mt-1">
              Plan and track your path to first user
            </p>
          </div>
          <div className="flex items-center gap-3">
            {ideas.length > 0 && (
              <Select value={selectedIdeaId || ""} onValueChange={setSelectedIdeaId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select idea" />
                </SelectTrigger>
                <SelectContent>
                  {ideas.map((idea) => (
                    <SelectItem key={idea.id} value={idea.id}>
                      {idea.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!roadmap && selectedIdeaId && (
              <Button onClick={generateRoadmap} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Roadmap
              </Button>
            )}
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No ideas yet</h3>
            <p className="text-muted-foreground mt-1">Create an idea first to generate a roadmap</p>
          </div>
        ) : !roadmap ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No roadmap yet</h3>
            <p className="text-muted-foreground mt-1">Generate a roadmap for your selected idea</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview */}
            <div className="glass-card rounded-2xl p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {roadmap.mvp_scope && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">MVP Scope</h4>
                    <p className="text-foreground">{roadmap.mvp_scope}</p>
                  </div>
                )}
                {roadmap.first_user_path && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Path to First User</h4>
                    <p className="text-foreground">{roadmap.first_user_path}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-6 mt-6">
                {roadmap.tech_stack.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.tech_stack.map((tech, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {roadmap.estimated_build_time && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Build Time</h4>
                    <span className="text-sm font-medium text-foreground">
                      {roadmap.estimated_build_time}
                    </span>
                  </div>
                )}
              </div>
              {/* Build with Emergent.sh Button */}
              <div className="mt-6 pt-6 border-t border-border">
                <a
                  href="https://app.emergent.sh/?via=sumit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <Rocket className="w-4 h-4" />
                  Build this idea live with Emergent.sh
                </a>
                <p className="text-xs text-muted-foreground mt-2">
                  Turn your validated idea into a working app using no-code
                </p>
              </div>
            </div>

            {/* Progress */}
            {steps.length > 0 && (
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {completedSteps}/{steps.length} steps
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => toggleStepComplete(step.id, step.completed)}
                  className={cn(
                    "w-full glass-card rounded-xl p-4 flex items-start gap-4 text-left transition-all hover:bg-muted/50",
                    step.completed && "opacity-60"
                  )}
                >
                  <div className="mt-0.5">
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">Step {step.step_number}</span>
                    </div>
                    <p
                      className={cn(
                        "font-medium text-foreground mt-1",
                        step.completed && "line-through"
                      )}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
