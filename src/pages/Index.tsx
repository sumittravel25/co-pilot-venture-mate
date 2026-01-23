import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Lightbulb, MessageSquare, BarChart3 } from "lucide-react";
import { useEffect } from "react";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">SOLOAIDE</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <a href="#about">About Us</a>
            </Button>
            <Button onClick={() => navigate("/auth")} variant="secondary">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Your AI partner for building{" "}
            <span className="gradient-text">startups</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
            Get honest feedback, validate ideas, plan MVPs, and track progress.
            Built for solo founders who want execution over hype.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <Button onClick={() => navigate("/auth")} size="lg">
              Start Building
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

           <div className="flex flex-wrap justify-center gap-3 mt-6">
             <Button variant="outline" onClick={() => navigate("/privacy")}
             >
               Privacy Policy
             </Button>
             <Button variant="outline" onClick={() => navigate("/refund")}
             >
               Refund Policy
             </Button>
             <Button variant="outline" onClick={() => navigate("/contact")}
             >
               Contact Us
             </Button>
             <Button variant="outline" onClick={() => navigate("/terms")}
             >
               Terms & Conditions
             </Button>
           </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
          {[
            { icon: Lightbulb, title: "Validate Ideas", desc: "Get a validation score and honest feedback on your startup concept" },
            { icon: MessageSquare, title: "AI Co-Founder", desc: "Strategic conversations that remember context and challenge assumptions" },
            { icon: BarChart3, title: "Track Progress", desc: "Log decisions, metrics, and get weekly reviews with hard truths" },
          ].map((feature, i) => (
            <div key={i} className="glass-card rounded-xl p-6 text-center animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mt-4">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{feature.desc}</p>
            </div>
          ))}
        </div>

        <section id="about" className="max-w-4xl mx-auto mt-24 scroll-mt-24">
          <div className="glass-card rounded-2xl p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">About Us</h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              SOLOAIDE is built for solo founders who want execution over hype—helping you validate ideas,
              plan MVPs, and stay accountable with clear, structured guidance.
            </p>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              If you need support, you can reach us via the Contact Us page.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => navigate("/contact")}>
                Contact Us
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button asChild variant="outline">
                <a href="/#about">Copyable About URL</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
