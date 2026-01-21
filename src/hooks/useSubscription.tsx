import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionContextType {
  isLegacyUser: boolean;
  isSubscribed: boolean;
  subscriptionPlan: string | null;
  subscriptionEndDate: Date | null;
  loading: boolean;
  hasAccess: boolean;
  refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLegacyUser, setIsLegacyUser] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_legacy_user, subscription_status, subscription_plan, subscription_end_date")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching subscription:", error);
        setLoading(false);
        return;
      }

      const legacy = data?.is_legacy_user ?? false;
      const status = data?.subscription_status;
      const endDate = data?.subscription_end_date ? new Date(data.subscription_end_date) : null;
      
      // Check if subscription is still valid
      const isActive = status === 'active' && endDate && endDate > new Date();

      setIsLegacyUser(legacy);
      setIsSubscribed(isActive);
      setSubscriptionPlan(data?.subscription_plan ?? null);
      setSubscriptionEndDate(endDate);
    } catch (error) {
      console.error("Error in subscription check:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // User has access if they are a legacy user OR have an active subscription
  const hasAccess = isLegacyUser || isSubscribed;

  return (
    <SubscriptionContext.Provider value={{
      isLegacyUser,
      isSubscribed,
      subscriptionPlan,
      subscriptionEndDate,
      loading,
      hasAccess,
      refetch: fetchSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
