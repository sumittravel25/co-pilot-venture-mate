import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SubscriptionGate } from "@/components/subscription/SubscriptionGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, GitBranch, Loader2, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type ConfidenceLevel = "low" | "medium" | "high";

interface Decision {
  id: string;
  title: string;
  description: string;
  options_considered: string[];
  chosen_option: string;
  reasoning: string | null;
  confidence_level: ConfidenceLevel | null;
  expected_outcome: string | null;
  actual_outcome: string | null;
  created_at: string;
}

export default function Decisions() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDecision, setNewDecision] = useState<{
    title: string;
    description: string;
    options: string;
    chosen_option: string;
    reasoning: string;
    confidence_level: ConfidenceLevel;
    expected_outcome: string;
  }>({
    title: "",
    description: "",
    options: "",
    chosen_option: "",
    reasoning: "",
    confidence_level: "medium",
    expected_outcome: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) loadDecisions();
  }, [user]);

  const loadDecisions = async () => {
    const { data, error } = await supabase
      .from("decisions")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading decisions", variant: "destructive" });
    } else {
      setDecisions((data || []) as Decision[]);
    }
    setIsLoading(false);
  };

  const handleCreateDecision = async () => {
    if (!newDecision.title.trim() || !newDecision.chosen_option.trim()) return;

    const optionsArray = newDecision.options
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean);

    const { data, error } = await supabase
      .from("decisions")
      .insert({
        user_id: user!.id,
        title: newDecision.title,
        description: newDecision.description,
        options_considered: optionsArray,
        chosen_option: newDecision.chosen_option,
        reasoning: newDecision.reasoning || null,
        confidence_level: newDecision.confidence_level,
        expected_outcome: newDecision.expected_outcome || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to log decision", variant: "destructive" });
    } else {
      setDecisions([data as Decision, ...decisions]);
      setNewDecision({
        title: "",
        description: "",
        options: "",
        chosen_option: "",
        reasoning: "",
        confidence_level: "medium",
        expected_outcome: "",
      });
      setIsDialogOpen(false);
      toast({ title: "Decision logged" });
    }
  };

  const getConfidenceColor = (level: string | null) => {
    switch (level) {
      case "high":
        return "bg-score-high/10 text-score-high border-score-high/20";
      case "medium":
        return "bg-score-medium/10 text-score-medium border-score-medium/20";
      case "low":
        return "bg-score-low/10 text-score-low border-score-low/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout>
      <SubscriptionGate>
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Decisions</h1>
            <p className="text-muted-foreground mt-1">
              Track decisions for future reference
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Log Decision
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Log a decision</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Decision</Label>
                  <Input
                    id="title"
                    value={newDecision.title}
                    onChange={(e) => setNewDecision({ ...newDecision, title: e.target.value })}
                    placeholder="What did you decide?"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Context</Label>
                  <Textarea
                    id="description"
                    value={newDecision.description}
                    onChange={(e) =>
                      setNewDecision({ ...newDecision, description: e.target.value })
                    }
                    placeholder="What prompted this decision?"
                    className="mt-1.5"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="options">Options Considered (one per line)</Label>
                  <Textarea
                    id="options"
                    value={newDecision.options}
                    onChange={(e) => setNewDecision({ ...newDecision, options: e.target.value })}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    className="mt-1.5 font-mono text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="chosen">Chosen Option</Label>
                  <Input
                    id="chosen"
                    value={newDecision.chosen_option}
                    onChange={(e) =>
                      setNewDecision({ ...newDecision, chosen_option: e.target.value })
                    }
                    placeholder="Which option did you choose?"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="reasoning">Reasoning</Label>
                  <Textarea
                    id="reasoning"
                    value={newDecision.reasoning}
                    onChange={(e) =>
                      setNewDecision({ ...newDecision, reasoning: e.target.value })
                    }
                    placeholder="Why did you choose this option?"
                    className="mt-1.5"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Confidence Level</Label>
                    <Select
                      value={newDecision.confidence_level}
                      onValueChange={(value) =>
                        setNewDecision({
                          ...newDecision,
                          confidence_level: value as "low" | "medium" | "high",
                        })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expected">Expected Outcome</Label>
                    <Input
                      id="expected"
                      value={newDecision.expected_outcome}
                      onChange={(e) =>
                        setNewDecision({ ...newDecision, expected_outcome: e.target.value })
                      }
                      placeholder="What do you expect?"
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateDecision}
                  className="w-full"
                  disabled={!newDecision.title.trim() || !newDecision.chosen_option.trim()}
                >
                  Log Decision
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : decisions.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No decisions logged</h3>
            <p className="text-muted-foreground mt-1">Track your startup decisions here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {decisions.map((decision) => (
              <div key={decision.id} className="glass-card rounded-xl p-6 animate-fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-foreground">{decision.title}</h3>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded-full border capitalize",
                          getConfidenceColor(decision.confidence_level)
                        )}
                      >
                        {decision.confidence_level || "unknown"} confidence
                      </span>
                    </div>

                    {decision.description && (
                      <p className="text-muted-foreground mt-2 text-sm">{decision.description}</p>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      {decision.options_considered.map((option, i) => (
                        <span
                          key={i}
                          className={cn(
                            "text-xs px-2 py-1 rounded-md",
                            option === decision.chosen_option
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {option === decision.chosen_option && (
                            <Check className="w-3 h-3 inline mr-1" />
                          )}
                          {option}
                        </span>
                      ))}
                    </div>

                    {decision.reasoning && (
                      <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>{decision.reasoning}</p>
                      </div>
                    )}
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {format(new Date(decision.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </SubscriptionGate>
    </DashboardLayout>
  );
}
