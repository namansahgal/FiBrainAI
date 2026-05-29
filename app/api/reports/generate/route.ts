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

  const fullPrompt = `COMPANY FINANCIAL DATA:
${financialContext}

INSTRUCTION:
Generate a complete investor update for this startup. Format as:

FINANCIAL SUMMARY
- Cash, burn, revenue, runway table

KEY HIGHLIGHTS THIS PERIOD
- 3 bullet points: what changed and why

BURN BREAKDOWN
- Category table with amounts

OUTLOOK
- 2-3 sentences on financial position

RECOMMENDATIONS
- Top 2 actions for the next 30 days

Be specific with rupee amounts.
Use data from the brief.
Maximum 300 words.
Format cleanly.`;

  // ── Call generateInsight ────────────────────────────────────────────────
  let response = await generateInsight(fullPrompt, systemPrompt);

  if (!response) {
    return NextResponse.json({
      error: "Failed to generate report. The AI provider is temporarily unavailable.",
    }, { status: 500 });
  }

  return NextResponse.json({ response });
}
