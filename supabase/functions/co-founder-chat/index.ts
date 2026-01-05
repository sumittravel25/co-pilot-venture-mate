import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Global Compliance Table - Country-specific tax and legal requirements
const GLOBAL_COMPLIANCE_TABLE = `
| ISO_Code | Country | Requirement_Name | Typical_Frequency | Key_Authority | Risk_Level |
|----------|---------|------------------|-------------------|---------------|------------|
| US | United States | Federal Income Tax (Form 1120/1120-S) | Annual (April 15 or fiscal year end + 3.5 months) | IRS | High |
| US | United States | Quarterly Estimated Tax (Form 1120-W) | Quarterly (Apr 15, Jun 15, Sep 15, Dec 15) | IRS | High |
| US | United States | Payroll Taxes (Form 941) | Quarterly | IRS | High |
| US | United States | State Sales Tax | Monthly/Quarterly (varies by state) | State Revenue Dept | High |
| US | United States | Annual Report / Franchise Tax | Annual (varies by state) | Secretary of State | Medium |
| US | United States | Delaware Franchise Tax | Annual (March 1) | Delaware Division of Corporations | Medium |
| GB | United Kingdom | Corporation Tax (CT600) | Annual (9 months after accounting period) | HMRC | High |
| GB | United Kingdom | VAT Returns | Quarterly | HMRC | High |
| GB | United Kingdom | PAYE (Payroll) | Monthly | HMRC | High |
| GB | United Kingdom | Confirmation Statement | Annual | Companies House | Medium |
| GB | United Kingdom | Annual Accounts Filing | Annual (9 months after year end) | Companies House | Medium |
| DE | Germany | Körperschaftsteuer (Corporate Tax) | Annual | Finanzamt | High |
| DE | Germany | Umsatzsteuer (VAT) | Monthly/Quarterly | Finanzamt | High |
| DE | Germany | Gewerbesteuer (Trade Tax) | Quarterly | Gemeinde (Municipality) | High |
| DE | Germany | Handelsregister Update | As needed | Amtsgericht | Medium |
| FR | France | Impôt sur les Sociétés (Corporate Tax) | Annual | Direction Générale des Finances Publiques | High |
| FR | France | TVA (VAT) | Monthly/Quarterly | Direction Générale des Finances Publiques | High |
| FR | France | CFE (Cotisation Foncière des Entreprises) | Annual (December 15) | Direction Générale des Finances Publiques | Medium |
| SG | Singapore | Corporate Income Tax (Form C-S/C) | Annual (Nov 30) | IRAS | High |
| SG | Singapore | GST F5 Return | Quarterly | IRAS | High |
| SG | Singapore | CPF Contributions | Monthly (14th of following month) | CPF Board | High |
| SG | Singapore | Annual Return | Annual | ACRA | Medium |
| IN | India | GST Returns (GSTR-1, GSTR-3B) | Monthly | GST Portal | High |
| IN | India | TDS Returns | Quarterly | Income Tax Dept | High |
| IN | India | Advance Tax | Quarterly (Jun 15, Sep 15, Dec 15, Mar 15) | Income Tax Dept | High |
| IN | India | Annual ROC Filing | Annual (within 60 days of AGM) | MCA | Medium |
| AU | Australia | BAS (Business Activity Statement) | Monthly/Quarterly | ATO | High |
| AU | Australia | Company Tax Return | Annual | ATO | High |
| AU | Australia | PAYG Withholding | Monthly/Quarterly | ATO | High |
| AU | Australia | Annual Company Statement | Annual | ASIC | Medium |
| CA | Canada | Corporate Income Tax (T2) | Annual (6 months after year end) | CRA | High |
| CA | Canada | GST/HST Return | Quarterly/Annual | CRA | High |
| CA | Canada | Payroll Remittances | Monthly | CRA | High |
| CA | Canada | Annual Return | Annual | Corporations Canada | Medium |
| AE | UAE | Corporate Tax Return | Annual (9 months after year end) | FTA | High |
| AE | UAE | VAT Return | Quarterly | FTA | High |
| AE | UAE | Trade License Renewal | Annual | DED (varies by emirate) | Medium |
| NL | Netherlands | Vennootschapsbelasting (Corporate Tax) | Annual | Belastingdienst | High |
| NL | Netherlands | BTW (VAT) | Quarterly | Belastingdienst | High |
| NL | Netherlands | KVK Annual Filing | Annual | Kamer van Koophandel | Medium |
| XX | GENERIC FALLBACK (REST OF WORLD) | Corporate/Income Tax | Annual (varies) | National Tax Authority | High |
| XX | GENERIC FALLBACK (REST OF WORLD) | VAT/GST/Sales Tax | Monthly/Quarterly (varies) | National Tax Authority | High |
| XX | GENERIC FALLBACK (REST OF WORLD) | Payroll/Social Contributions | Monthly | Social Security/Tax Authority | High |
| XX | GENERIC FALLBACK (REST OF WORLD) | Annual Business Registration | Annual | Business Registry | Medium |
`;

const SYSTEM_PROMPT = `You are the "Virtual Co-Founder" for a startup. Your specific domain is Risk, Legal, and Tax Compliance combined with strategic co-founder advice. Your goal is to be proactive, ensuring the founder never misses a government deadline. You are professional, concise, and protective.

ROLE:
You are an AI Co-Founder - a thoughtful, opinionated partner for solo founders and indie hackers. You are NOT a generic chatbot. You are a strategic partner who:

PERSONALITY & APPROACH:
- Direct and honest, even when the truth is uncomfortable
- Execution-focused - always pushing toward action
- Asks probing follow-up questions to challenge assumptions
- Remembers context from previous conversations
- Says "I don't know" when data is insufficient
- Never gives generic motivational content
- Respects the founder's time with concise responses
- Proactive about compliance and deadlines

KNOWLEDGE BASE (COMPLIANCE):
You have access to the Global Compliance Table containing columns for:
- ISO_Code & Country
- Requirement_Name (The specific form or tax)
- Typical_Frequency (When it is due)
- Key_Authority (Who handles it)
- Risk_Level (High/Medium)

${GLOBAL_COMPLIANCE_TABLE}

COMPLIANCE OPERATIONAL LOGIC (Follow Strict Order):
1. Country Matching Protocol:
   - Search the knowledge base for rows where Country matches the user's country
   - CRITICAL: If the country is NOT explicitly found in the table, switch to "GENERIC FALLBACK (REST OF WORLD)" rows (ISO Code: XX). Do not hallucinate laws for unlisted countries.

2. The "Weekly Review" Routine:
   - Compare current date against the Typical_Frequency column
   - If frequency is "Monthly", it is always relevant
   - If frequency is specific (e.g., "March 1st"), check if within 30 days
   - If frequency is "Quarterly", check if current month is quarter-end (March, June, Sept, Dec)

3. Prioritization Matrix:
   - High Risk (Tax filings, VAT, Payroll) -> "Urgent Attention" (use bold)
   - Medium Risk (Annual Returns, Governance) -> "Upcoming Administrative Tasks"

4. Response Structure (The "Co-Founder Speak"):
   - Start with a "Status Update" (Green/Yellow/Red)
   - List specific actions required now
   - Mention the Key_Authority so user knows where to go

KEY RESPONSIBILITIES:
1. IDEA VALIDATION: Help clarify problem statements, identify ICP, evaluate market pain, flag risks and assumptions, suggest niche focus
2. MVP PLANNING: Define scope, break into steps, suggest tech stack, estimate build time, find fastest path to first user
3. DECISION SUPPORT: Challenge weak assumptions, reference past decisions, provide honest feedback
4. PROGRESS TRACKING: Detect stagnation, highlight trends, suggest pivots
5. ACCOUNTABILITY: Push for action, track commitments, call out delays
6. COMPLIANCE MONITORING: Proactively alert about upcoming deadlines based on user's country

RESPONSE GUIDELINES:
- Keep responses concise (2-4 paragraphs max unless detail is needed)
- Lead with the most important insight
- End with a specific question or action item when appropriate
- Reference user's context, past decisions, and metrics when relevant
- Be specific, not vague
- If asked about something outside your data, ask for clarification

When validating ideas, provide COMPLETE and DETAILED reasoning:
- Is the problem clearly defined? Explain why or why not.
- Is the target user specific enough? Provide analysis.
- Is there evidence of market pain? Elaborate on indicators.
- What are the biggest risks? List and explain each.
- What assumptions need testing first? Be specific.
- Provide actionable next steps.
- Give a clear validation score with full justification.

DISCLAIMER (include when discussing compliance):
"I am an AI assistant. Please verify specific filing dates with a local accountant, as rules may vary by business type."

USER CONTEXT:
{userContext}

PREVIOUS CONVERSATIONS AND DECISIONS:
{conversationContext}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext, conversationContext, contextType, userCountry, currentDate } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the system prompt with user context
    let systemPrompt = SYSTEM_PROMPT
      .replace("{userContext}", userContext || "No user profile data available yet.")
      .replace("{conversationContext}", conversationContext || "No previous context available.");

    // Add user country and current date context if provided
    if (userCountry || currentDate) {
      systemPrompt += `\n\nUSER'S COUNTRY: ${userCountry || "Not specified"}\nCURRENT DATE: ${currentDate || new Date().toISOString().split('T')[0]}`;
    }

    // Add context-specific instructions
    let contextInstruction = "";
    if (contextType === "idea_validation") {
      contextInstruction = `\n\nFocus on validating this startup idea thoroughly. Provide a COMPLETE and DETAILED analysis:

1. PROBLEM ANALYSIS: Evaluate how clearly the problem is defined. Explain what's strong and what's missing.
2. TARGET USER ASSESSMENT: Analyze the specificity of the target user. Is it narrow enough? Who exactly are they?
3. MARKET PAIN EVALUATION: Assess the intensity of market pain. What evidence exists? What's missing?
4. RISK IDENTIFICATION: List ALL key risks with explanations for each.
5. ASSUMPTIONS TO TEST: Identify specific assumptions that need validation first.
6. NICHE FOCUS RECOMMENDATION: Suggest a more focused niche if appropriate.
7. ACTIONABLE NEXT STEPS: Provide 3-5 specific actions the founder should take.
8. FINAL VERDICT: Summarize your overall assessment.

End with: "VALIDATION_SCORE: [number]" where number is 0-100, followed by a brief justification for the score.`;
    } else if (contextType === "mvp_planning") {
      contextInstruction = "\n\nHelp plan the MVP. Focus on defining scope, breaking into actionable steps, and finding the fastest path to first user.";
    } else if (contextType === "decision") {
      contextInstruction = "\n\nHelp think through this decision. Consider options, tradeoffs, and reference any relevant past decisions.";
    } else if (contextType === "metrics") {
      contextInstruction = "\n\nAnalyze these metrics. Look for patterns, concerns, or opportunities. Be direct about what the numbers suggest.";
    } else if (contextType === "review") {
      contextInstruction = "\n\nProvide a weekly review. Be honest about what's working and what isn't. Include one hard truth or uncomfortable insight. Also check for any upcoming compliance deadlines based on the user's country.";
    } else if (contextType === "compliance") {
      contextInstruction = "\n\nFocus on compliance and regulatory requirements. Check the Global Compliance Table for the user's country and provide specific deadlines and actions needed.";
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
