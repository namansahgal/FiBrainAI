import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateInsight } from "@/src/lib/ai/gemini";
import { getStoredBrief } from "@/src/lib/intelligence/storeBrief";
import {
  isSupabaseConfigured,
  supabaseAdmin,
} from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  // ── Auth ────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Fetch stored brief ──────────────────────────────────────────────────
  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!company) {
    return NextResponse.json({
      error: "Complete onboarding first to set up your company profile.",
    }, { status: 400 });
  }

  const financialContext = await getStoredBrief(company.id);

  if (!financialContext) {
    return NextResponse.json({
      error: "Upload a bank statement first so I can analyze your finances.",
    }, { status: 400 });
  }

  // ── Parse request body ──────────────────────────────────────────────────
  let body: { reportType?: string; period?: string } = {};
  try {
    body = await request.json();
  } catch {
    // ignore parsing errors
  }

  const reportType = body.reportType || "investor_update";
  const period = body.period || "this_month";

  const periodTextMap: Record<string, string> = {
    this_month: "This Month",
    last_month: "Last Month",
    last_3_months: "Last 3 Months",
    last_6_months: "Last 6 Months",
  };
  const periodText = periodTextMap[period] || "This Month";

  // ── Build prompt ────────────────────────────────────────────────────────
  const systemPrompt = `You are FiBrainAI — the AI CFO for this startup. You have complete access to their financial data shown below.

You speak like a sharp, senior CFO who has worked with 200+ Indian startups.

Rules you never break:
- Always give specific rupee amounts
- Never say "it depends" without immediately explaining what it depends on
- Give ONE clear recommendation per answer
- Sound like a smart friend who knows finance — not a textbook
- Understand Indian context: GST quarters, TDS deductions, Indian VC timelines

You are talking to a founder who is brilliant at building but needs financial clarity. Respect their intelligence.
Be direct. Be specific. Be useful.`;

  let fullPrompt = "";

  if (reportType === "burn_analysis") {
    fullPrompt = `COMPANY FINANCIAL DATA:
${financialContext}

REPORT CONTEXT:
Report Type: Burn Analysis
Period Covered: ${periodText}

INSTRUCTION:
Generate a detailed spending and Burn Analysis report for this startup for the period: ${periodText}. Focus heavily on spending efficiency, expense categories, benchmarks, and potential waste. Format the report EXACTLY as follows:

FINANCIAL SUMMARY
Cash Position: [amount]
Monthly Burn: [amount]
Net Burn: [amount]
Revenue: [amount]
Runway: [number] months
Zero Cash Date: [date]

BURN BREAKDOWN
[List each category and its spending amount, plus percentage of total burn, e.g. "Salaries: ₹5,00,000 (60%)", formatted clearly]

KEY OBSERVATIONS
- [Observation 1: biggest spend driver and comparison with seed stage benchmarks]
- [Observation 2: MoM trends and potential savings in SaaS, cloud, office, etc.]
- [Observation 3: runway threat level and general burn efficiency]

RECOMMENDATIONS
1. [Action 1: specific expense area to reduce or audit]
2. [Action 2: runway target milestone or growth safety margin]

Be specific with rupee amounts. Use the exact data from the brief. Format section headers exactly as written above in uppercase. Maximum 350 words.`;
  } else if (reportType === "fundraising_brief") {
    fullPrompt = `COMPANY FINANCIAL DATA:
${financialContext}

REPORT CONTEXT:
Report Type: Fundraising Brief
Period Covered: ${periodText}

INSTRUCTION:
Generate a Fundraising Brief report for this startup for the period: ${periodText}. Focus on investor appeal, growth economics, and funding strategies. Format the report EXACTLY as follows:

FINANCIAL SUMMARY
Cash Position: [amount]
Monthly Burn: [amount]
Net Burn: [amount]
Revenue: [amount]
Runway: [number] months
Zero Cash Date: [date]

BURN BREAKDOWN
[List each category and its spending amount, plus percentage of total burn, e.g. "Salaries: ₹5,00,000 (60%)", formatted clearly]

KEY OBSERVATIONS
- [Observation 1: investor-readiness of the runway and capital efficiency]
- [Observation 2: revenue trends vs monthly burn trajectories]
- [Observation 3: target timeframe for starting next raise and ideal round sizing]

RECOMMENDATIONS
1. [Action 1: target capital to raise (in ₹) and runway milestones to achieve before pitching]
2. [Action 2: key metric or data room preparation task to do first]

Be specific with rupee amounts. Use the exact data from the brief. Format section headers exactly as written above in uppercase. Maximum 350 words.`;
  } else {
    // Default to investor_update
    fullPrompt = `COMPANY FINANCIAL DATA:
${financialContext}

REPORT CONTEXT:
Report Type: Investor Update
Period Covered: ${periodText}

INSTRUCTION:
Generate a complete investor-ready update for this startup for the period: ${periodText}. Focus on transparency and high-level milestones. Format the report EXACTLY as follows:

FINANCIAL SUMMARY
Cash Position: [amount]
Monthly Burn: [amount]
Net Burn: [amount]
Revenue: [amount]
Runway: [number] months
Zero Cash Date: [date]

BURN BREAKDOWN
[List each category and its spending amount, plus percentage of total burn, e.g. "Salaries: ₹5,00,000 (60%)", formatted clearly]

KEY OBSERVATIONS
- [Observation 1: runway duration, safety factor, and cash runway comfort]
- [Observation 2: biggest changes in revenue or expenditure category this period]
- [Observation 3: key progress indicator or operational comment]

RECOMMENDATIONS
1. [Action 1: top priority runway action]
2. [Action 2: top operational budget correction action]

Be specific with rupee amounts. Use the exact data from the brief. Format section headers exactly as written above in uppercase. Maximum 350 words.`;
  }

  // ── Call generateInsight ────────────────────────────────────────────────
  let response = await generateInsight(fullPrompt, systemPrompt);

  if (!response) {
    return NextResponse.json({
      error: "Failed to generate report. The AI provider is temporarily unavailable.",
    }, { status: 500 });
  }

  return NextResponse.json({ response });
}
