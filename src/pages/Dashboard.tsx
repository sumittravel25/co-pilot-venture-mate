import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Lightbulb, Map, MessageSquare, GitBranch, BarChart3, FileText, ArrowRight } from "lucide-react";

const quickLinks = [
  { icon: Lightbulb, label: "Submit an Idea", path: "/dashboard/ideas", description: "Validate your startup concept" },
  { icon: Map, label: "Plan MVP", path: "/dashboard/roadmap", description: "Create your execution roadmap" },
  { icon: MessageSquare, label: "Chat with AI", path: "/dashboard/chat", description: "Get strategic advice" },
  { icon: GitBranch, label: "Log Decision", path: "/dashboard/decisions", description: "Track key decisions" },
  { icon: BarChart3, label: "Track Metrics", path: "/dashboard/metrics", description: "Monitor your progress" },
  { icon: FileText, label: "Weekly Review", path: "/dashboard/reviews", description: "Reflect and plan ahead" },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) return null;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">What do you want to work on today?</p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="glass-card rounded-xl p-5 text-left hover:bg-muted/50 transition-all group animate-fade-in"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <link.icon className="w-5 h-5 text-primary" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-medium text-foreground mt-4">{link.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
