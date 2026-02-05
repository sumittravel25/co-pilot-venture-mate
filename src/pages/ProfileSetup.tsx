import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowRight, ArrowLeft, Loader2, User, Briefcase, Clock, Brain, BookOpen, Globe, Shield } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const STEPS = [
  { id: 1, title: "Core Identity", icon: User },
  { id: 2, title: "Skills & Strengths", icon: Briefcase },
  { id: 3, title: "Constraints", icon: Clock },
  { id: 4, title: "Work Style", icon: Brain },
  { id: 5, title: "Learning", icon: BookOpen },
  { id: 6, title: "Geography", icon: Globe },
  { id: 7, title: "Privacy", icon: Shield },
];

const SKILLS_OPTIONS = [
  "Product Management",
  "Software Development",
  "UI/UX Design",
  "Marketing",
  "Sales",
  "Finance",
  "Operations",
  "Data Analysis",
  "Content Creation",
  "Customer Support",
  "Business Strategy",
  "Project Management",
];

const STRUGGLES_OPTIONS = [
  "Staying focused",
  "Making decisions",
  "Time management",
  "Technical skills",
  "Marketing",
  "Finding customers",
  "Pricing",
  "Delegation",
  "Work-life balance",
  "Perfectionism",
];

interface ProfileData {
  full_name: string;
  primary_role: string;
  industry: string;
  experience_level: string;
  primary_skills: string[];
  biggest_strength: string;
  time_availability_hours: number | null;
  budget_comfort: string;
  risk_tolerance: string;
  decision_style: string;
  common_struggles: string[];
  feedback_style: string;
  learning_preference: string;
  inspirations: string;
  country: string;
  timezone: string;
  allow_ai_influence: boolean;
  allow_anonymized_learning: boolean;
  exclude_sensitive_entries: boolean;
}

export default function ProfileSetup() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    primary_role: "",
    industry: "",
    experience_level: "",
    primary_skills: [],
    biggest_strength: "",
    time_availability_hours: null,
    budget_comfort: "",
    risk_tolerance: "",
    decision_style: "",
    common_struggles: [],
    feedback_style: "",
    learning_preference: "",
    inspirations: "",
    country: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    allow_ai_influence: true,
    allow_anonymized_learning: false,
    exclude_sensitive_entries: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      // Check if profile is already completed
      const checkProfile = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("profile_completed, full_name")
          .eq("user_id", user.id)
          .single();

        if (data?.profile_completed) {
          navigate("/dashboard");
        } else {
          // Pre-fill full name from auth metadata
          setProfile(prev => ({
            ...prev,
            full_name: user.user_metadata?.full_name || data?.full_name || "",
          }));
          setCheckingProfile(false);
        }
      };
      checkProfile();
    }
  }, [user, loading, navigate]);

  const updateProfile = (key: keyof ProfileData, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: "primary_skills" | "common_struggles", item: string) => {
    setProfile(prev => ({
      ...prev,
      [key]: prev[key].includes(item)
        ? prev[key].filter(i => i !== item)
        : [...prev[key], item],
    }));
  };

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ...profile,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile complete!",
        description: "Your AI Co-Founder is now personalized to help you better.",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const CurrentIcon = STEPS[step - 1].icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-semibold text-foreground">AI Co-Founder</span>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {step} of {STEPS.length}</span>
            <span className="text-sm font-medium text-foreground">{STEPS[step - 1].title}</span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s.id <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-6">
          <div className="glass-card rounded-2xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CurrentIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{STEPS[step - 1].title}</h2>
                <p className="text-sm text-muted-foreground">
                  {step === 1 && "Tell us about yourself and your background"}
                  {step === 2 && "What are you good at?"}
                  {step === 3 && "Understanding your resources and limits"}
                  {step === 4 && "How do you work and make decisions?"}
                  {step === 5 && "How do you prefer to learn?"}
                  {step === 6 && "Optional location information"}
                  {step === 7 && "Control how your data is used"}
                </p>
              </div>
            </div>

            {/* Step 1: Core Identity */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name (optional)</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => updateProfile("full_name", e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_role">Primary Role / Profession</Label>
                  <Input
                    id="primary_role"
                    value={profile.primary_role}
                    onChange={(e) => updateProfile("primary_role", e.target.value)}
                    placeholder="e.g., Software Engineer, Product Manager, Designer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry / Domain</Label>
                  <Input
                    id="industry"
                    value={profile.industry}
                    onChange={(e) => updateProfile("industry", e.target.value)}
                    placeholder="e.g., SaaS, E-commerce, Healthcare"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <Select
                    value={profile.experience_level}
                    onValueChange={(value) => updateProfile("experience_level", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner - Just starting out</SelectItem>
                      <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                      <SelectItem value="experienced">Experienced - Seasoned professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Skills & Strengths */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Primary Skills (select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SKILLS_OPTIONS.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleArrayItem("primary_skills", skill)}
                        className={`p-3 rounded-lg text-sm text-left transition-colors border ${
                          profile.primary_skills.includes(skill)
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-muted/50 border-border hover:bg-muted"
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biggest_strength">Biggest Strength</Label>
                  <Textarea
                    id="biggest_strength"
                    value={profile.biggest_strength}
                    onChange={(e) => updateProfile("biggest_strength", e.target.value)}
                    placeholder="What's the one thing you're really good at?"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Constraints & Availability */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="time_availability">Time Availability (hours per week)</Label>
                  <Input
                    id="time_availability"
                    type="number"
                    min={0}
                    max={168}
                    value={profile.time_availability_hours || ""}
                    onChange={(e) => updateProfile("time_availability_hours", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="e.g., 20"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Budget Comfort</Label>
                  <Select
                    value={profile.budget_comfort}
                    onValueChange={(value) => updateProfile("budget_comfort", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your budget situation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bootstrapped">Bootstrapped - Minimal to no budget</SelectItem>
                      <SelectItem value="small_budget">Small Budget - Can invest modestly</SelectItem>
                      <SelectItem value="can_invest">Can Invest - Have capital available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Risk Tolerance</Label>
                  <Select
                    value={profile.risk_tolerance}
                    onValueChange={(value) => updateProfile("risk_tolerance", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How comfortable are you with risk?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Prefer safe, proven paths</SelectItem>
                      <SelectItem value="medium">Medium - Calculated risks are okay</SelectItem>
                      <SelectItem value="high">High - Comfortable with uncertainty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 4: Decision & Work Style */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Decision Style</Label>
                  <Select
                    value={profile.decision_style}
                    onValueChange={(value) => updateProfile("decision_style", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How do you make decisions?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analytical">Analytical - Data-driven decisions</SelectItem>
                      <SelectItem value="intuitive">Intuitive - Trust my gut</SelectItem>
                      <SelectItem value="fast_reversible">Fast & Reversible - Decide quickly, adjust later</SelectItem>
                      <SelectItem value="slow_careful">Slow & Careful - Think thoroughly first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Common Struggles (select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {STRUGGLES_OPTIONS.map((struggle) => (
                      <button
                        key={struggle}
                        onClick={() => toggleArrayItem("common_struggles", struggle)}
                        className={`p-3 rounded-lg text-sm text-left transition-colors border ${
                          profile.common_struggles.includes(struggle)
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-muted/50 border-border hover:bg-muted"
                        }`}
                      >
                        {struggle}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Feedback Style</Label>
                  <Select
                    value={profile.feedback_style}
                    onValueChange={(value) => updateProfile("feedback_style", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How should I give you feedback?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct - No sugarcoating, tell me straight</SelectItem>
                      <SelectItem value="balanced">Balanced - Mix of encouragement and critique</SelectItem>
                      <SelectItem value="gentle">Gentle - Be encouraging, soften criticisms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 5: Learning Preferences */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Learning Preference</Label>
                  <Select
                    value={profile.learning_preference}
                    onValueChange={(value) => updateProfile("learning_preference", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How do you prefer to learn?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="step_by_step">Step-by-step - Break things down</SelectItem>
                      <SelectItem value="big_picture">Big-picture first - Show me the vision</SelectItem>
                      <SelectItem value="examples">Examples & case studies - Show me real examples</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inspirations">People or Thinking Styles You Resonate With (optional)</Label>
                  <Textarea
                    id="inspirations"
                    value={profile.inspirations}
                    onChange={(e) => updateProfile("inspirations", e.target.value)}
                    placeholder="e.g., Paul Graham, Naval Ravikant, or describe a thinking style you admire"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 6: Geography */}
            {step === 6 && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  This helps provide relevant tax, legal, and regulatory guidance.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="country">Country / Region (optional)</Label>
                  <Input
                    id="country"
                    value={profile.country}
                    onChange={(e) => updateProfile("country", e.target.value)}
                    placeholder="e.g., United States, United Kingdom"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Time Zone</Label>
                  <Input
                    id="timezone"
                    value={profile.timezone}
                    onChange={(e) => updateProfile("timezone", e.target.value)}
                    placeholder="Auto-detected from your browser"
                  />
                  <p className="text-xs text-muted-foreground">
                    We've auto-detected your timezone. You can change it if needed.
                  </p>
                </div>
              </div>
            )}

            {/* Step 7: Privacy & Control */}
            {step === 7 && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Control how your profile data influences AI responses.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 border border-border">
                    <Checkbox
                      id="allow_ai_influence"
                      checked={profile.allow_ai_influence}
                      onCheckedChange={(checked) => updateProfile("allow_ai_influence", checked)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="allow_ai_influence" className="font-medium cursor-pointer">
                        Allow Profile to Influence AI Advice
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Your profile data will be used to personalize AI responses
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 border border-border">
                    <Checkbox
                      id="allow_anonymized_learning"
                      checked={profile.allow_anonymized_learning}
                      onCheckedChange={(checked) => updateProfile("allow_anonymized_learning", checked)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="allow_anonymized_learning" className="font-medium cursor-pointer">
                        Allow Anonymized Pattern Learning
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Help improve the AI by allowing anonymized usage patterns
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 border border-border">
                    <Checkbox
                      id="exclude_sensitive_entries"
                      checked={profile.exclude_sensitive_entries}
                      onCheckedChange={(checked) => updateProfile("exclude_sensitive_entries", checked)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="exclude_sensitive_entries" className="font-medium cursor-pointer">
                        Exclude Sensitive Entries from AI Analysis
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Sensitive entries you mark won't be included in AI context
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {step < STEPS.length ? (
            <Button onClick={handleNext} className="gap-2">
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
