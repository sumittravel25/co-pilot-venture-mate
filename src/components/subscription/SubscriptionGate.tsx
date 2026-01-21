import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { hasAccess, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return <>{children}</>;
  }

  if (!hasAccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 glass-card rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Subscription Required
            </h2>
            <p className="text-muted-foreground">
              Subscribe to unlock all features and get personalized AI insights for your startup journey.
            </p>
          </div>
          <Button onClick={() => navigate("/pricing")} className="gap-2">
            <Crown className="w-4 h-4" />
            View Plans
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
