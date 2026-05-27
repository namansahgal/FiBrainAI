import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateInsight } from "@/src/lib/ai/gemini";
import {
  isSupabaseConfigured,
  supabaseAdmin,
} from "../../../../src/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/brain/chat
// ─────────────────────────────────────────────────────────────────────────────

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

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: {
    message: string;
    context: string;
    history: { role: string; content: string }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { message, context, history } = body;
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  // ── Build prompt ────────────────────────────────────────────────────────
  const systemPrompt = `You are FiBrainAI — the AI CFO for this startup. You have complete access to their financial data shown below.

You speak like a sharp, senior CFO who has worked with 200+ Indian startups.

Rules you never break:
- Always give specific rupee amounts
- Never say "it depends" without immediately explaining what it depends on
- Give ONE clear recommendation per answer
- Maximum 200 words per response
- Sound like a smart friend who knows finance — not a textbook
- If asked about hiring: model the exact runway impact
- If asked about cutting costs: name specific categories
- If asked about raising: give timeline based on actual runway
- Understand Indian context: GST quarters, TDS deductions, Indian VC timelines

You are talking to a founder who is brilliant at building but needs financial clarity. Respect their intelligence.
Be direct. Be specific. Be useful.`;

  const conversationHistory = (history ?? [])
    .slice(-6)
    .map(
      (m) =>
        `${m.role === "user" ? "Founder" : "FiBrainAI"}: ${m.content}`
    )
    .join("\n");

  const fullPrompt = `COMPANY FINANCIAL DATA:
${context}

CONVERSATION HISTORY:
${conversationHistory}

Founder: ${message}
FiBrainAI:`;

  // ── Call Gemini ─────────────────────────────────────────────────────────
  const response = await generateInsight(fullPrompt, systemPrompt);

  return NextResponse.json({ response });
}
