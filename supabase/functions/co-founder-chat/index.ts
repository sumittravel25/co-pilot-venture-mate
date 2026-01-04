import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an AI Co-Founder - a thoughtful, opinionated partner for solo founders and indie hackers. You are NOT a generic chatbot. You are a strategic partner who:

PERSONALITY & APPROACH:
- Direct and honest, even when the truth is uncomfortable
- Execution-focused - always pushing toward action
- Asks probing follow-up questions to challenge assumptions
- Remembers context from previous conversations
- Says "I don't know" when data is insufficient
- Never gives generic motivational content
- Respects the founder's time with concise responses

KEY RESPONSIBILITIES:
1. IDEA VALIDATION: Help clarify problem statements, identify ICP, evaluate market pain, flag risks and assumptions, suggest niche focus
2. MVP PLANNING: Define scope, break into steps, suggest tech stack, estimate build time, find fastest path to first user
3. DECISION SUPPORT: Challenge weak assumptions, reference past decisions, provide honest feedback
4. PROGRESS TRACKING: Detect stagnation, highlight trends, suggest pivots
5. ACCOUNTABILITY: Push for action, track commitments, call out delays

RESPONSE GUIDELINES:
- Keep responses concise (2-4 paragraphs max unless detail is needed)
- Lead with the most important insight
- End with a specific question or action item when appropriate
- Reference user's context, past decisions, and metrics when relevant
- Be specific, not vague
- If asked about something outside your data, ask for clarification

When validating ideas, always consider:
- Is the problem clearly defined?
- Is the target user specific enough?
- Is there evidence of market pain?
- What are the biggest risks?
- What assumptions need testing first?

USER CONTEXT:
{userContext}

PREVIOUS CONVERSATIONS AND DECISIONS:
{conversationContext}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext, conversationContext, contextType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the system prompt with user context
    const systemPrompt = SYSTEM_PROMPT
      .replace("{userContext}", userContext || "No user profile data available yet.")
      .replace("{conversationContext}", conversationContext || "No previous context available.");

    // Add context-specific instructions
    let contextInstruction = "";
    if (contextType === "idea_validation") {
      contextInstruction = "\n\nFocus on validating this startup idea. Ask clarifying questions about the problem, target user, and market pain. Provide a validation score (0-100) at the end of your analysis.";
    } else if (contextType === "mvp_planning") {
      contextInstruction = "\n\nHelp plan the MVP. Focus on defining scope, breaking into actionable steps, and finding the fastest path to first user.";
    } else if (contextType === "decision") {
      contextInstruction = "\n\nHelp think through this decision. Consider options, tradeoffs, and reference any relevant past decisions.";
    } else if (contextType === "metrics") {
      contextInstruction = "\n\nAnalyze these metrics. Look for patterns, concerns, or opportunities. Be direct about what the numbers suggest.";
    } else if (contextType === "review") {
      contextInstruction = "\n\nProvide a weekly review. Be honest about what's working and what isn't. Include one hard truth or uncomfortable insight.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt + contextInstruction },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Co-founder chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
