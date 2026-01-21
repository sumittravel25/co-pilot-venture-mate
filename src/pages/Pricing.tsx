import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Check, Loader2, Crown, ArrowLeft } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PRICING = {
  INR: {
    monthly: { amount: 1499, display: "₹1,499" },
    yearly: { amount: 14999, display: "₹14,999", savings: "₹2,989" },
  },
  USD: {
    monthly: { amount: 17.99, display: "$17.99" },
    yearly: { amount: 179.99, display: "$179.99", savings: "$35.89" },
  },
};

export default function Pricing() {
  const { user, session } = useAuth();
  const { hasAccess, isLegacyUser, refetch } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currency, setCurrency] = useState<"INR" | "USD">("USD");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Detect user's location for currency
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        if (data.country_code === "IN") {
          setCurrency("INR");
        }
      } catch (error) {
        console.log("Could not detect location, defaulting to USD");
      }
    };
    detectLocation();
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = async () => {
    if (!user || !session) {
      navigate("/auth");
      return;
    }

    if (!razorpayLoaded) {
      toast({
        title: "Please wait",
        description: "Payment system is loading...",
      });
      return;
    }

    setLoading(true);

    try {
      // Create order via edge function
      const { data, error } = await supabase.functions.invoke("razorpay-create-order", {
        body: {
          plan_type: selectedPlan,
          currency: currency,
        },
      });

      if (error) {
        throw error;
      }

      // Open Razorpay checkout
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "CoFounder AI",
        description: `${selectedPlan === "monthly" ? "Monthly" : "Yearly"} Subscription`,
        order_id: data.order_id,
        handler: async function (response: any) {
          // Verify payment
          try {
            const { error: verifyError } = await supabase.functions.invoke("razorpay-verify-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_type: selectedPlan,
              },
            });

            if (verifyError) {
              throw verifyError;
            }

            toast({
              title: "Subscription activated!",
              description: "Welcome to CoFounder AI Pro. Enjoy all features!",
            });

            await refetch();
            navigate("/dashboard");
          } catch (err) {
            toast({
              title: "Payment verification failed",
              description: "Please contact support if you were charged.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          email: user.email,
          name: user.user_metadata?.full_name || "",
        },
        theme: {
          color: "#14b8a6",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: "Could not initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pricing = PRICING[currency];

  if (hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isLegacyUser ? "You have lifetime access!" : "You're subscribed!"}
          </h1>
          <p className="text-muted-foreground">
            {isLegacyUser
              ? "As an early user, you have free access to all features forever."
              : "Enjoy full access to all CoFounder AI features."}
          </p>
          <Button onClick={() => navigate("/dashboard")} className="gap-2">
            Go to Dashboard
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-semibold text-foreground">CoFounder AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={currency === "INR" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrency("INR")}
            >
              ₹ INR
            </Button>
            <Button
              variant={currency === "USD" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrency("USD")}
            >
              $ USD
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Unlock Your AI Co-Founder
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get personalized insights, strategic advice, and compliance guidance to build your startup smarter.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Monthly */}
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`glass-card rounded-2xl p-6 text-left transition-all ${
                selectedPlan === "monthly"
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
            >
              <h3 className="text-lg font-semibold text-foreground">Monthly</h3>
              <div className="mt-4">
                <span className="text-3xl font-bold text-foreground">{pricing.monthly.display}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Billed monthly, cancel anytime</p>
            </button>

            {/* Yearly */}
            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`glass-card rounded-2xl p-6 text-left transition-all relative ${
                selectedPlan === "yearly"
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                Save {pricing.yearly.savings}
              </div>
              <h3 className="text-lg font-semibold text-foreground">Yearly</h3>
              <div className="mt-4">
                <span className="text-3xl font-bold text-foreground">{pricing.yearly.display}</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Billed annually, best value</p>
            </button>
          </div>

          {/* Features */}
          <div className="glass-card rounded-2xl p-6 max-w-2xl mx-auto">
            <h4 className="font-medium text-foreground mb-4">Everything included:</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "AI-powered idea validation",
                "Personalized MVP roadmaps",
                "Strategic chat advisor",
                "Decision tracking & analysis",
                "Metrics monitoring",
                "Weekly progress reviews",
                "Compliance & tax alerts",
                "Proactive insights",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleSubscribe}
              disabled={loading || !razorpayLoaded}
              className="gap-2 min-w-[200px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  Subscribe Now
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Secure payment powered by Razorpay. Cancel anytime.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
