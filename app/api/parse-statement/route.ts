import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateInsight } from "@/src/lib/ai/gemini";
import { parseStatement } from "../../../src/lib/parsers/bankParser";
import { buildFinancialBrief } from "../../../src/lib/intelligence/buildFinancialBrief";
import { storeBrief } from "../../../src/lib/intelligence/storeBrief";
import {
  isSupabaseConfigured,
  supabaseAdmin,
} from "../../../src/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n.toFixed(0)}`;
}

function parseCashBalance(range: string): number {
  if (!range) return 0;
  if (range.includes("Under ₹10L")) return 500_000;
  if (range.includes("₹10L-₹50L")) return 3_000_000;
  if (range.includes("₹50L-₹2Cr")) return 12_500_000;
  if (range.includes("₹2Cr-₹10Cr")) return 60_000_000;
  if (range.includes("₹10Cr+")) return 150_000_000;
  return 0;
}

/** Group transactions by YYYY-MM month key */
function groupByMonth<T extends { date: string }>(
  txns: T[]
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const tx of txns) {
    const key = tx.date.slice(0, 7); // "YYYY-MM"
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/parse-statement
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // ── Parse multipart form ───────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  // Context passed from onboarding (optional — improves Gemini prompt)
  const sector       = (formData.get("sector")       as string | null) ?? "";
  const teamSize     = (formData.get("teamSize")      as string | null) ?? "";
  const fundingStage = (formData.get("fundingStage")  as string | null) ?? "";
  const cashRange    = (formData.get("cashRange")     as string | null) ?? "";
  // company_id is optional — if present we save to DB
  const companyId    = (formData.get("company_id")    as string | null) ?? null;

  // ── Parse the statement ────────────────────────────────────────────────
  const parsed = await parseStatement(file);

  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (parsed.transactions.length === 0) {
    return NextResponse.json(
      { error: "No transactions found in the file. Make sure it's a bank statement." },
      { status: 400 }
    );
  }

  const { transactions, summary } = parsed;

  // ── Compute aggregate metrics ──────────────────────────────────────────
  const debits  = transactions.filter((t) => t.type === "debit");
  const credits = transactions.filter(
    (t) => t.type === "credit" && !t.isSalary
  );

  const totalBurn    = debits.reduce((s, t) => s + t.amount, 0);
  const totalRevenue = credits.reduce((s, t) => s + t.amount, 0);
  const netBurn      = Math.max(totalBurn - totalRevenue, 0);

  // Months in date range
  const monthsCount = (() => {
    if (!summary.dateRange.from || !summary.dateRange.to) return 1;
    const from = new Date(summary.dateRange.from);
    const to   = new Date(summary.dateRange.to);
    const diff = (to.getFullYear() - from.getFullYear()) * 12 +
                 (to.getMonth() - from.getMonth()) + 1;
    return Math.max(diff, 1);
  })();

  const avgMonthlyBurn = totalBurn / monthsCount;

  // Category breakdown (debits only)
  const catMap: Record<string, number> = {};
  debits.forEach((t) => {
    catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
  });
  const topCategories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Cash balance from range (from onboarding) or 0
  const cashBalance = parseCashBalance(cashRange);
  const divisor     = netBurn > 0 ? netBurn / monthsCount : avgMonthlyBurn;
  const runwayMonths = divisor > 0 ? parseFloat((cashBalance / divisor).toFixed(1)) : 0;

  // Top category
  const topCategory = topCategories[0]?.[0] ?? "Other";

  // ── Build financial brief ───────────────────────────────────────────────
  const briefTxns = transactions.map((t) => ({
    id: t.date + t.amount,
    amount: t.amount,
    type: t.type,
    category: t.category,
    description: t.description,
    transaction_date: t.date,
    is_recurring: t.isRecurring,
  }));

  const brief = buildFinancialBrief(
    {
      name: "Startup",
      sector: sector || "Not specified",
      stage: fundingStage || "Not specified",
      team_size: teamSize || "Not specified",
      primary_pain_point: "",
    },
    {
      funding_stage: fundingStage || "Not specified",
      cash_balance_range: cashRange,
      monthly_spend_range: "",
      monthly_revenue: 0,
    },
    briefTxns,
    []
  );

  console.log("[parse-statement] Brief generated:");
  console.log("  Token estimate:", brief.metadata.totalTokensEstimate);
  console.log("  Transactions analyzed:", brief.metadata.transactionsAnalyzed);

  // ── Generate Gemini insight using brief ─────────────────────────────────
  const systemPrompt =
    "You are FiBrainAI, an AI CFO for early-stage Indian startups. You speak like a sharp, experienced CFO who has worked with hundreds of startups. You are direct, specific, never vague. You give one clear recommendation. You understand the Indian startup ecosystem deeply — UPI, GST, NEFT, burn culture, runway pressure. Never say 'I' — speak in second person about the founder's situation.";

  const userPrompt = `${brief.markdown}\n\n---\n\nGenerate a first insight for this founder. Start with the single most important thing they need to know right now. Be specific with rupee amounts. Give one clear recommendation. Maximum 150 words. Sound like a sharp CFO friend, not a corporate tool.`;

  let insightText = await generateInsight(userPrompt, systemPrompt);

  // Computed fallback when AI is unavailable (rate limited / quota exhausted)
  if (!insightText) {
    const topCat = topCategories[0];
    const topCatName = topCat?.[0] ?? "operating costs";
    const topCatAmt = topCat?.[1] ?? 0;
    const topCatPct = totalBurn > 0 ? ((topCatAmt / totalBurn) * 100).toFixed(0) : "0";

    const parts: string[] = [];
    parts.push(`Your average monthly burn is ${fmt(avgMonthlyBurn)} across ${monthsCount} month${monthsCount !== 1 ? "s" : ""} of data.`);
    parts.push(`Biggest cost: ${topCatName} at ${fmt(topCatAmt)} (${topCatPct}% of total spend).`);

    if (runwayMonths > 0 && runwayMonths < 200) {
      parts.push(`At this rate, you have roughly ${runwayMonths} months of runway.`);
      if (runwayMonths < 6) {
        parts.push("⚠️ That's under 6 months — start fundraising conversations now.");
      } else if (runwayMonths < 9) {
        parts.push("Consider starting fundraise prep — VCs in India take 3-4 months to close.");
      }
    }

    if (topCategories.length > 1) {
      parts.push(`Second biggest spend: ${topCategories[1][0]} at ${fmt(topCategories[1][1])}.`);
    }

    parts.push("Head to the Brain tab for detailed financial Q&A.");
    insightText = parts.join(" ");
    console.log("[parse-statement] Used computed fallback insight (AI unavailable)");
  }

  // ── Save to Supabase (only if company_id provided) ─────────────────────
  if (companyId && isSupabaseConfigured && supabaseAdmin) {
    try {
      // Verify user owns this company
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
      const { data: { user } } = await sb.auth.getUser();

      if (user) {
        // a. Upsert transactions (clear this period first, then insert)
        const txRows = transactions.map((t) => ({
          company_id:       companyId,
          amount:           t.amount,
          type:             t.type,
          category:         t.category,
          description:      t.description,
          raw_description:  t.rawDescription,
          transaction_date: t.date,
          source:           "upload",
          is_recurring:     t.isRecurring,
          confidence_score: t.confidence,
        }));

        await supabaseAdmin.from("transactions").insert(txRows);

        // b. Monthly snapshots
        const byMonth = groupByMonth(transactions);
        for (const [monthKey, monthTxns] of byMonth) {
          const mDebits  = monthTxns.filter((t) => t.type === "debit");
          const mCredits = monthTxns.filter((t) => t.type === "credit" && !t.isSalary);
          const mGross   = mDebits.reduce((s, t) => s + t.amount, 0);
          const mRev     = mCredits.reduce((s, t) => s + t.amount, 0);
          const mNet     = Math.max(mGross - mRev, 0);
          const mRunway  = mNet > 0 && cashBalance > 0
            ? parseFloat((cashBalance / mNet).toFixed(1))
            : 0;

          const mCatMap: Record<string, number> = {};
          mDebits.forEach((t) => {
            mCatMap[t.category] = (mCatMap[t.category] ?? 0) + t.amount;
          });

          await supabaseAdmin.from("monthly_snapshots").upsert(
            {
              company_id:         companyId,
              month:              `${monthKey}-01`,
              gross_burn:         mGross,
              total_revenue:      mRev,
              net_burn:           mNet,
              cash_balance:       cashBalance,
              runway_months:      mRunway,
              category_breakdown: mCatMap,
              updated_at:         new Date().toISOString(),
            },
            { onConflict: "company_id,month" }
          );
        }

        // c. Save insight
        const severity =
          runwayMonths > 0 && runwayMonths < 6 ? "critical"
          : runwayMonths > 0 && runwayMonths < 12 ? "warning"
          : "info";

        await supabaseAdmin.from("insights").insert({
          company_id: companyId,
          type:       "first_insight",
          severity,
          content:    insightText,
        });

        // d. Build full brief with real company data and store it
        const { data: companyData } = await supabaseAdmin
          .from("companies")
          .select("name, sector, company_age, team_size, primary_pain_point")
          .eq("id", companyId)
          .single();

        const { data: finData } = await supabaseAdmin
          .from("company_financials")
          .select("funding_stage, cash_balance_range, monthly_spend_range")
          .eq("company_id", companyId)
          .single();

        if (companyData && finData) {
          const fullBrief = buildFinancialBrief(
            {
              name: companyData.name,
              sector: companyData.sector,
              stage: companyData.company_age,
              team_size: companyData.team_size,
              primary_pain_point: companyData.primary_pain_point ?? "",
            },
            {
              funding_stage: finData.funding_stage,
              cash_balance_range: finData.cash_balance_range,
              monthly_spend_range: finData.monthly_spend_range,
              monthly_revenue: 0,
            },
            briefTxns,
            []
          );

          await storeBrief(companyId, fullBrief.markdown);
          console.log("[parse-statement] Brief stored for company:", companyId);
        }
      }
    } catch (dbErr) {
      // DB errors should not fail the API response — log and continue
      console.error("[parse-statement] DB save error:", dbErr);
    }
  }

  // ── Return response ────────────────────────────────────────────────────
  return NextResponse.json({
    success: true,
    transactionCount: transactions.length,
    insight: insightText,
    summary: {
      totalBurn,
      avgMonthlyBurn,
      runwayMonths,
      salaryDetected:  summary.salaryDetected,
      salaryAmount:    summary.salaryAmount,
      topCategory,
      dateRange:       summary.dateRange,
      bankDetected:    summary.bankDetected,
      categoryBreakdown: Object.fromEntries(topCategories),
    },
  });
}
