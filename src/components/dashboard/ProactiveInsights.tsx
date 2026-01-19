import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Calendar, Lightbulb, Map, BarChart3, FileText, RefreshCw, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Insight {
  type: "compliance" | "roadmap" | "idea" | "metric" | "review";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  dueInfo?: string;
}

const typeConfig = {
  compliance: { icon: Calendar, color: "text-amber-500", bg: "bg-amber-500/10", path: "/dashboard/chat" },
  roadmap: { icon: Map, color: "text-blue-500", bg: "bg-blue-500/10", path: "/dashboard/roadmap" },
  idea: { icon: Lightbulb, color: "text-purple-500", bg: "bg-purple-500/10", path: "/dashboard/ideas" },
  metric: { icon: BarChart3, color: "text-emerald-500", bg: "bg-emerald-500/10", path: "/dashboard/metrics" },
  review: { icon: FileText, color: "text-rose-500", bg: "bg-rose-500/10", path: "/dashboard/reviews" },
};

const priorityStyles = {
  high: "border-l-4 border-l-destructive",
  medium: "border-l-4 border-l-amber-500",
  low: "border-l-4 border-l-muted-foreground",
};

export function ProactiveInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Please sign in to see insights");
        setLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('proactive-insights', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch insights');
      }

      setInsights(response.data?.insights || []);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError("Couldn't load insights. Try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleInsightClick = (insight: Insight) => {
    const config = typeConfig[insight.type];
    navigate(config.path);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/20" />
          <div className="h-6 w-48 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const insightCount = insights.length;
  const highPriorityCount = insights.filter(i => i.priority === 'high').length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="glass-card rounded-xl">
      <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-foreground">Your Co-Founder Says...</h2>
            {!isOpen && insightCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {highPriorityCount > 0 ? (
                  <span className="text-destructive font-medium">{highPriorityCount} urgent</span>
                ) : null}
                {highPriorityCount > 0 && insightCount - highPriorityCount > 0 ? ' • ' : ''}
                {insightCount - highPriorityCount > 0 ? `${insightCount - highPriorityCount} more tasks` : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchInsights();
            }}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh insights"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-6 pb-6">
          {error ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No urgent tasks right now. Keep building!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, index) => {
                const config = typeConfig[insight.type];
                const Icon = config.icon;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleInsightClick(insight)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all",
                      priorityStyles[insight.priority],
                      "animate-fade-in"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                        <Icon className={cn("w-4 h-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground truncate">{insight.title}</h3>
                          {insight.dueInfo && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                              {insight.dueInfo}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                        <p className="text-xs text-primary mt-2 font-medium">→ {insight.action}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
