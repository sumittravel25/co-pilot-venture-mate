import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Global Compliance Table for proactive alerts
const GLOBAL_COMPLIANCE_TABLE = `
| ISO_Code | Country | Requirement_Name | Typical_Frequency | Key_Authority | Risk_Level |
|----------|---------|------------------|-------------------|---------------|------------|
| US | United States | Federal Income Tax (Form 1120) | Annual (March 15 / April 15) | IRS | High |
| US | United States | Quarterly Estimated Tax (Form 1120-W) | Quarterly | IRS | High |
| US | United States | State Sales Tax | Monthly/Quarterly | State DOR | High |
| US | United States | Annual Report / Franchise Tax | Annual (varies by state) | Secretary of State | Medium |
| GB | United Kingdom | Corporation Tax Return (CT600) | Annual (12 months after year end) | HMRC | High |
| GB | United Kingdom | VAT Return | Quarterly | HMRC | High |
| GB | United Kingdom | PAYE (Payroll Tax) | Monthly | HMRC | High |
| GB | United Kingdom | Confirmation Statement | Annual | Companies House | Medium |
| DE | Germany | Körperschaftsteuer (Corporate Tax) | Annual | Finanzamt | High |
| DE | Germany | Umsatzsteuer-Voranmeldung (VAT) | Monthly/Quarterly | Finanzamt | High |
| DE | Germany | Gewerbesteuer (Trade Tax) | Quarterly | Gemeinde | High |
| SG | Singapore | Corporate Income Tax (Form C-S/C) | Annual (Nov 30) | IRAS | High |
| SG | Singapore | GST F5 Return | Quarterly | IRAS | High |
| SG | Singapore | CPF Contributions | Monthly (14th) | CPF Board | High |
| SG | Singapore | Annual Return | Annual | ACRA | Medium |
| IN | India | GST Return (GSTR-3B) | Monthly (20th) | GSTN | High |
| IN | India | TDS Return | Quarterly | Income Tax Dept | High |
| IN | India | Corporate Tax (Advance Tax) | Quarterly | Income Tax Dept | High |
| IN | India | Annual Return (MCA ROC) | Annual (Oct 30) | MCA | Medium |
| AE | UAE | Corporate Tax | Annual | FTA | High |
| AE | UAE | VAT Return | Quarterly | FTA | High |
| AE | UAE | Economic Substance Report | Annual | Ministry of Finance | Medium |
| AU | Australia | BAS (GST/PAYG) | Quarterly | ATO | High |
| AU | Australia | Company Tax Return | Annual | ATO | High |
| AU | Australia | Superannuation | Quarterly | ATO | High |
| AU | Australia | ASIC Annual Review | Annual | ASIC | Medium |
| CA | Canada | GST/HST Return | Quarterly/Annual | CRA | High |
| CA | Canada | Corporate Tax (T2) | Annual (6 months after year end) | CRA | High |
| CA | Canada | Payroll Remittances | Monthly | CRA | High |
| CA | Canada | Annual Return | Annual | Corporations Canada | Medium |
| XX | Generic Fallback (REST OF WORLD) | VAT/Sales Tax | Monthly/Quarterly | Local Tax Authority | High |
| XX | Generic Fallback (REST OF WORLD) | Corporate/Income Tax | Annual | Local Tax Authority | High |
| XX | Generic Fallback (REST OF WORLD) | Payroll/Social Contributions | Monthly | Local Tax/Labor Authority | High |
| XX | Generic Fallback (REST OF WORLD) | Annual Company Filing | Annual | Company Registrar | Medium |
`;

const SYSTEM_PROMPT = `You are a proactive AI co-founder assistant. Your job is to analyze the user's current startup state and generate 3-5 actionable, time-sensitive insights.

KNOWLEDGE BASE:
${GLOBAL_COMPLIANCE_TABLE}

CURRENT DATE: {{current_date}}
USER'S COUNTRY: {{user_country}}

RULES:
1. Analyze ideas that need validation or haven't been worked on
2. Check roadmap steps that are overdue or upcoming
3. Alert about compliance deadlines based on the user's country
4. Identify stagnant metrics or missed weekly reviews
5. Suggest next best actions based on their current progress

OUTPUT FORMAT (JSON array):
[
  {
    "type": "compliance" | "roadmap" | "idea" | "metric" | "review",
    "priority": "high" | "medium" | "low",
    "title": "Brief title",
    "description": "Actionable description (1-2 sentences)",
    "action": "Suggested next step",
    "dueInfo": "When this is due or relevant (optional)"
  }
]

Be specific, direct, and helpful. Focus on what needs immediate attention.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user data in parallel
    const [profileResult, ideasResult, roadmapsResult, metricsResult, reviewsResult] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', user.id).single(),
      supabaseClient.from('ideas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabaseClient.from('roadmaps').select('*, roadmap_steps(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabaseClient.from('metrics').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(10),
      supabaseClient.from('weekly_reviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
    ]);

    const userCountry = profileResult.data?.country || 'United States';
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const userContext = {
      profile: profileResult.data,
      ideas: ideasResult.data || [],
      roadmaps: roadmapsResult.data || [],
      metrics: metricsResult.data || [],
      reviews: reviewsResult.data || [],
    };

    const prompt = SYSTEM_PROMPT
      .replace('{{current_date}}', currentDate)
      .replace('{{user_country}}', userCountry);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: prompt },
          { 
            role: 'user', 
            content: `Here is my current startup state. Generate proactive insights:\n\n${JSON.stringify(userContext, null, 2)}` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate insights' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Parse the JSON from the response
    let insights = [];
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      insights = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse insights:', parseError, content);
      insights = [];
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in proactive-insights:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
