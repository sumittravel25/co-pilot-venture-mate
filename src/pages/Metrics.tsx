import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import { Plus, BarChart3, TrendingUp, Users, DollarSign, Beaker, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type MetricType = "users" | "revenue" | "experiment" | "learning";

interface Metric {
  id: string;
  metric_type: MetricType;
  value: string;
  notes: string | null;
  recorded_at: string;
  created_at: string;
}

const metricIcons: Record<MetricType, typeof Users> = {
  users: Users,
  revenue: DollarSign,
  experiment: Beaker,
  learning: BookOpen,
};

const metricLabels: Record<MetricType, string> = {
  users: "Users Acquired",
  revenue: "Revenue",
  experiment: "Experiment",
  learning: "Learning",
};

export default function Metrics() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMetric, setNewMetric] = useState({
    metric_type: "users" as MetricType,
    value: "",
    notes: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) loadMetrics();
  }, [user]);

  const loadMetrics = async () => {
    const { data, error } = await supabase
      .from("metrics")
      .select("*")
      .eq("user_id", user!.id)
      .order("recorded_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading metrics", variant: "destructive" });
    } else {
      setMetrics((data || []) as Metric[]);
    }
    setIsLoading(false);
  };

  const handleCreateMetric = async () => {
    if (!newMetric.value.trim()) return;

    const { data, error } = await supabase
      .from("metrics")
      .insert({
        user_id: user!.id,
        metric_type: newMetric.metric_type,
        value: newMetric.value,
        notes: newMetric.notes || null,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to log metric", variant: "destructive" });
    } else {
      setMetrics([data as Metric, ...metrics]);
      setNewMetric({ metric_type: "users", value: "", notes: "" });
      setIsDialogOpen(false);
      toast({ title: "Metric logged" });
    }
  };

  // Group metrics by type for summary
  const metricSummary = metrics.reduce((acc, m) => {
    if (!acc[m.metric_type]) {
      acc[m.metric_type] = [];
    }
    acc[m.metric_type].push(m);
    return acc;
  }, {} as Record<MetricType, Metric[]>);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Metrics</h1>
            <p className="text-muted-foreground mt-1">
              Track your progress and learnings
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Log Metric
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log a metric</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Metric Type</Label>
                  <Select
                    value={newMetric.metric_type}
                    onValueChange={(value) =>
                      setNewMetric({ ...newMetric, metric_type: value as MetricType })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users">Users Acquired</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="experiment">Experiment Run</SelectItem>
                      <SelectItem value="learning">Key Learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    value={newMetric.value}
                    onChange={(e) => setNewMetric({ ...newMetric, value: e.target.value })}
                    placeholder={
                      newMetric.metric_type === "users"
                        ? "e.g., 25 signups"
                        : newMetric.metric_type === "revenue"
                        ? "e.g., $500 MRR"
                        : newMetric.metric_type === "experiment"
                        ? "e.g., A/B test pricing page"
                        : "e.g., Users want faster onboarding"
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={newMetric.notes}
                    onChange={(e) => setNewMetric({ ...newMetric, notes: e.target.value })}
                    placeholder="Any additional context..."
                    className="mt-1.5"
                    rows={2}
                  />
                </div>
                <Button onClick={handleCreateMetric} className="w-full" disabled={!newMetric.value.trim()}>
                  Log Metric
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["users", "revenue", "experiment", "learning"] as MetricType[]).map((type) => {
            const Icon = metricIcons[type];
            const count = metricSummary[type]?.length || 0;
            return (
              <div key={type} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{metricLabels[type]}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : metrics.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No metrics logged</h3>
            <p className="text-muted-foreground mt-1">Start tracking your progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {metrics.map((metric) => {
              const Icon = metricIcons[metric.metric_type];
              return (
                <div key={metric.id} className="glass-card rounded-xl p-4 flex items-start gap-4 animate-fade-in">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary uppercase">
                        {metricLabels[metric.metric_type]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(metric.recorded_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-foreground font-medium mt-1">{metric.value}</p>
                    {metric.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{metric.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
