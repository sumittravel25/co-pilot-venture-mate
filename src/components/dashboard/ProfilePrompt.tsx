import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { X, Sparkles, ArrowRight } from "lucide-react";

export function ProfilePrompt() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const checkProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("user_id", user.id)
        .single();

      setProfileCompleted(data?.profile_completed ?? false);
      setLoading(false);
    };

    checkProfile();
  }, [user]);

  if (loading || profileCompleted || dismissed) {
    return null;
  }

  return (
    <div className="glass-card rounded-xl p-4 border border-primary/20 bg-primary/5 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground">Complete your profile</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Update your profile to help the AI give you more personalized and relevant insights.
          </p>
          <Button
            variant="link"
            className="px-0 h-auto mt-2 text-primary gap-1"
            onClick={() => navigate("/dashboard/profile")}
          >
            Update profile
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
          onClick={() => setDismissed(true)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
