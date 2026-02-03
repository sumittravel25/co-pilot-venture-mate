import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { Crown, Calendar, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { differenceInDays, format } from "date-fns";

export function SubscriptionStatus() {
  const { 
    hasAccess, 
    isLegacyUser, 
    isSubscribed, 
    subscriptionPlan, 
    subscriptionEndDate,
    loading 
  } = useSubscription();
  const navigate = useNavigate();

  if (loading) return null;

  // Not subscribed - show upgrade prompt
  if (!hasAccess) {
    return (
      <div className="glass-card rounded-xl p-5 border border-border/50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">Upgrade to Pro</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get full access to all features and personalized AI insights.
            </p>
            <Button 
              onClick={() => navigate("/pricing")} 
              size="sm" 
              className="mt-3 gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              View Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Legacy user - lifetime access
  if (isLegacyUser) {
    return (
      <div className="glass-card rounded-xl p-5 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-lg" />
            <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">Lifetime Access</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                Early Supporter
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Thank you for being an early user! You have free access to all features forever.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active subscription
  if (isSubscribed && subscriptionEndDate) {
    const daysRemaining = differenceInDays(subscriptionEndDate, new Date());
    const formattedEndDate = format(subscriptionEndDate, "MMMM d, yyyy");
    const planLabel = subscriptionPlan === "yearly" ? "Yearly" : "Monthly";
    
    // Determine status color based on days remaining
    const isExpiringSoon = daysRemaining <= 7;
    const statusColor = isExpiringSoon 
      ? "text-[hsl(var(--score-medium))]" 
      : "text-[hsl(var(--score-high))]";

    return (
      <div className="glass-card rounded-xl p-5 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-lg" />
            <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-foreground">Pro Subscription</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                {planLabel} Plan
              </span>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-4">
              {/* Days Remaining */}
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${statusColor}`} />
                <div>
                  <p className={`text-lg font-semibold ${statusColor}`}>
                    {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                  </p>
                  <p className="text-xs text-muted-foreground">remaining</p>
                </div>
              </div>
              
              {/* Expiry Date */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{formattedEndDate}</p>
                  <p className="text-xs text-muted-foreground">expires on</p>
                </div>
              </div>
            </div>

            {isExpiringSoon && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Your subscription is expiring soon. Renew to continue access.
                </p>
                <Button 
                  onClick={() => navigate("/pricing")} 
                  size="sm" 
                  variant="outline"
                  className="gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Renew Subscription
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
