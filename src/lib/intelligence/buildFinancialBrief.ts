// ─────────────────────────────────────────────────────────────────────────────
// FiBrainAI — Financial Brief Builder
//
// The most critical file in FiBrainAI.
// Every AI call uses the output of this function.
// Raw transaction data NEVER goes to AI directly.
// Only the brief this function produces.
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  amount: number;
  type: "debit" | "credit";
  category: string;
  description: string;
  transaction_date: string;
  is_recurring: boolean;
};

type Company = {
  name: string;
  sector: string;
  stage: string;
  team_size: string;
  primary_pain_point: string;
};

type CompanyFinancials = {
  funding_stage: string;
  cash_balance_range: string;
  monthly_spend_range: string;
  monthly_revenue: number;
};


type FinancialBrief = {
  markdown: string;
  metadata: {
    totalTokensEstimate: number;
    transactionsAnalyzed: number;
    monthsCovered: number;
    generatedAt: string;
  };
};

// ── Cash balance parser ──────────────────────────────────────────────────────

function parseCashBalance(range: string): number {
  if (!range) return 0;
  if (range.includes("Under ₹10L")) return 500_000;
  if (range.includes("₹10L-₹50L")) return 3_000_000;
  if (range.includes("₹50L-₹2Cr")) return 12_500_000;
  if (range.includes("₹2Cr-₹10Cr")) return 60_000_000;
  if (range.includes("₹10Cr+")) return 150_000_000;
  return 0;
}

// ── Main function ────────────────────────────────────────────────────────────

export function buildFinancialBrief(
  company: Company,
  financials: CompanyFinancials,
  transactions: Transaction[]
): FinancialBrief {
  const now = new Date();

  // Use the latest month in the data — not the calendar month.
  // This ensures historical uploads show real data instead of ₹0.
  const sortedDates = transactions.map((t) => t.transaction_date).sort();
  const latestDate = sortedDates.length > 0
    ? new Date(sortedDates[sortedDates.length - 1])
    : now;
  const currentMonth = latestDate.getMonth() + 1;
  const currentYear = latestDate.getFullYear();

  // ── 1. SEPARATE DEBITS AND CREDITS ─────────────────────────────────────
  const debits = transactions.filter((t) => t.type === "debit");
  const credits = transactions.filter((t) => t.type === "credit");

  // ── 2. CURRENT MONTH CALCULATIONS ─────────────────────────────────────
  const currentMonthDebits = debits.filter((t) => {
    const d = new Date(t.transaction_date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const currentMonthCredits = credits.filter((t) => {
    const d = new Date(t.transaction_date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const grossBurn = currentMonthDebits.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  const totalRevenue = currentMonthCredits
    .reduce((sum, t) => sum + t.amount, 0);

  const netBurn = Math.max(0, grossBurn - totalRevenue);

  // ── 3. CASH AND RUNWAY ────────────────────────────────────────────────
  const cashBalance = parseCashBalance(financials.cash_balance_range);

  const runwayMonths =
    netBurn > 0
      ? cashBalance / netBurn
      : cashBalance / (grossBurn || 1);

  const zeroCashDate = new Date();
  zeroCashDate.setMonth(
    zeroCashDate.getMonth() + Math.floor(runwayMonths)
  );
  const zeroCashFormatted = zeroCashDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // ── 4. CATEGORY BREAKDOWN ─────────────────────────────────────────────
  const categoryTotals: Record<string, number> = {};
  currentMonthDebits.forEach((t) => {
    categoryTotals[t.category] =
      (categoryTotals[t.category] || 0) + t.amount;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const categoryRows = sortedCategories
    .map(([cat, amt]) => {
      const pct =
        grossBurn > 0 ? ((amt / grossBurn) * 100).toFixed(1) : "0";
      return `| ${cat} | ₹${amt.toLocaleString("en-IN")} | ${pct}% |`;
    })
    .join("\n");

  // ── 5. MONTH ON MONTH TREND ───────────────────────────────────────────
  const last3Months: string[] = [];

  for (let i = 2; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();

    const monthDebits = debits.filter((t) => {
      const td = new Date(t.transaction_date);
      return td.getMonth() + 1 === m && td.getFullYear() === y;
    });

    const monthBurn = monthDebits.reduce((sum, t) => sum + t.amount, 0);

    if (monthBurn > 0) {
      const monthName = d.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
      last3Months.push(
        `| ${monthName} | ₹${monthBurn.toLocaleString("en-IN")} |`
      );
    }
  }

  const trendTable =
    last3Months.length > 0
      ? last3Months.join("\n")
      : "| No historical data yet | — |";

  // ── 6. ANOMALY DETECTION ──────────────────────────────────────────────
  const anomalies: string[] = [];

  // Check categories growing significantly
  sortedCategories.forEach(([cat, currentAmt]) => {
    const lastMonthD = new Date();
    lastMonthD.setMonth(lastMonthD.getMonth() - 1);
    const lm = lastMonthD.getMonth() + 1;
    const ly = lastMonthD.getFullYear();

    const lastMonthAmt = debits
      .filter((t) => {
        const td = new Date(t.transaction_date);
        return (
          t.category === cat &&
          td.getMonth() + 1 === lm &&
          td.getFullYear() === ly
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    if (lastMonthAmt > 0) {
      const growth =
        ((currentAmt - lastMonthAmt) / lastMonthAmt) * 100;
      if (growth > 30) {
        anomalies.push(
          `- **${cat}** up ${growth.toFixed(0)}% vs last month ` +
            `(₹${lastMonthAmt.toLocaleString("en-IN")} → ₹${currentAmt.toLocaleString("en-IN")})`
        );
      }
    }
  });

  // Check SaaS over benchmark (>6% of burn)
  const saasBurn = categoryTotals["SaaS Tools"] || 0;
  const saasPercent =
    grossBurn > 0 ? (saasBurn / grossBurn) * 100 : 0;
  if (saasPercent > 6) {
    anomalies.push(
      `- **SaaS Tools** at ${saasPercent.toFixed(1)}% of burn — benchmark is 4-6% for your stage`
    );
  }

  // Check runway thresholds
  if (runwayMonths < 6) {
    anomalies.push(
      `- **⚠️ Critical:** Runway below 6 months — fundraising process should start immediately`
    );
  } else if (runwayMonths < 9) {
    anomalies.push(
      `- **⚠️ Warning:** Runway below 9 months — consider starting fundraise process`
    );
  }

  const anomalySection =
    anomalies.length > 0
      ? anomalies.join("\n")
      : "- No significant anomalies detected";

  // ── 7. RECURRING SUBSCRIPTIONS ────────────────────────────────────────
  const recurringItems = currentMonthDebits
    .filter((t) => t.is_recurring)
    .slice(0, 5)
    .map(
      (t) =>
        `- ${t.description}: ₹${t.amount.toLocaleString("en-IN")}/month`
    )
    .join("\n");

  const recurringSection =
    recurringItems || "- No recurring items detected yet";

  // ── 8. BENCHMARK CONTEXT ──────────────────────────────────────────────
  const benchmarkData: Record<string, string> = {
    "B2B SaaS": "Median burn ₹6L-₹9L/month for seed stage",
    SaaS: "Median burn ₹6L-₹9L/month for seed stage",
    D2C: "Median burn ₹8L-₹15L/month for seed stage",
    Marketplace: "Median burn ₹7L-₹12L/month for seed stage",
    Agency: "Median burn ₹4L-₹8L/month for seed stage",
    "Deep Tech": "Median burn ₹10L-₹20L/month for seed stage",
  };

  const benchmark =
    benchmarkData[company.sector] ||
    "Benchmark data being compiled for your sector";

  // ── 9. DATE RANGE ─────────────────────────────────────────────────────
  const dateRangeStr =
    sortedDates.length > 0
      ? `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`
      : "No data yet";

  // ── 10. BUILD THE MARKDOWN BRIEF ──────────────────────────────────────
  const markdown = `# FiBrainAI Financial Brief
**Company:** ${company.name}
**Generated:** ${now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}

---

## Company Profile
- **Sector:** ${company.sector}
- **Stage:** ${company.stage}
- **Team size:** ${company.team_size}
- **Funding:** ${financials.funding_stage}
- **Primary concern:** ${company.primary_pain_point}

---

## Current Financial Position
| Metric | Value |
|--------|-------|
| Cash in bank | ₹${cashBalance.toLocaleString("en-IN")} |
| Gross burn (this month) | ₹${grossBurn.toLocaleString("en-IN")} |
| Revenue (this month) | ₹${totalRevenue.toLocaleString("en-IN")} |
| Net burn | ₹${netBurn.toLocaleString("en-IN")} |
| Runway | ${runwayMonths.toFixed(1)} months |
| Zero cash date | ${zeroCashFormatted} |

---

## Burn Breakdown (Current Month)
| Category | Amount | % of Burn |
|----------|--------|-----------|
${categoryRows || "| No spending data this month | — | — |"}

---

## 3 Month Trend
| Month | Total Burn |
|-------|-----------|
${trendTable}

---

## Anomalies & Alerts
${anomalySection}

---

## Recurring Expenses
${recurringSection}

---

## Benchmark Context
${benchmark}

---

## Transactions Analyzed
- Total transactions: ${transactions.length}
- Debits: ${debits.length}
- Credits: ${credits.length}
- Date range: ${dateRangeStr}`.trim();

  // ── 11. ESTIMATE TOKEN COUNT ──────────────────────────────────────────
  const tokenEstimate = Math.ceil(markdown.length / 4);

  return {
    markdown,
    metadata: {
      totalTokensEstimate: tokenEstimate,
      transactionsAnalyzed: transactions.length,
      monthsCovered: last3Months.length,
      generatedAt: now.toISOString(),
    },
  };
}
