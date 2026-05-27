import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  isSupabaseConfigured,
  supabaseAdmin,
} from "../../../../src/lib/supabase/server";

/**
 * POST /api/onboarding/complete
 *
 * Saves company + financial data collected during onboarding.
 * Uses service role key to bypass RLS for inserts.
 * Verifies the calling user's session via their auth cookie.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  // ── Verify authenticated user via session cookie ──────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // read-only in API routes
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    companyName,
    sector,
    companyAge,
    teamSize,
    primaryPainPoint,
    fundingStage,
    cashBalanceRange,
    monthlySpendRange,
  } = body;

  if (!companyName?.trim()) {
    return NextResponse.json(
      { error: "Company name is required." },
      { status: 400 }
    );
  }

  // ── Insert company (service role bypasses RLS) ─────────────────────────
  const { data: company, error: companyError } = await supabaseAdmin
    .from("companies")
    .insert({
      user_id: user.id,
      name: companyName.trim(),
      sector: sector ?? "",
      company_age: companyAge ?? "",
      team_size: teamSize ?? "",
      primary_pain_point: primaryPainPoint ?? "",
      onboarding_completed: true,
    })
    .select("id")
    .single();

  if (companyError) {
    console.error("[onboarding/complete] company insert:", companyError);
    // Handle duplicate — user may have already onboarded
    if (companyError.code === "23505") {
      return NextResponse.json(
        { error: "Company already exists for this account." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  // ── Insert financials ──────────────────────────────────────────────────
  const { error: financialsError } = await supabaseAdmin
    .from("company_financials")
    .insert({
      company_id: company.id,
      funding_stage: fundingStage ?? "",
      cash_balance_range: cashBalanceRange ?? "",
      monthly_spend_range: monthlySpendRange ?? "",
    });

  if (financialsError) {
    console.error("[onboarding/complete] financials insert:", financialsError);
    return NextResponse.json(
      { error: financialsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, company_id: company.id });
}
