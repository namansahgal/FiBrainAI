"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  TrendingDown,
  DollarSign,
  Clipboard,
  Check,
  Loader2,
  Printer,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import AppLayout from "@/src/components/layout/AppLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Company = {
  id: string;
  name: string;
  sector: string;
};

type Snapshot = {
  id: string;
  month: string;
  gross_burn: number;
  total_revenue: number;
  net_burn: number;
  runway_months: number;
};

type ReportType = "investor_update" | "burn_analysis" | "fundraising_brief";
type Period = "this_month" | "last_month" | "last_3_months" | "last_6_months";

interface ParsedReport {
  financialSummary: { label: string; value: string }[];
  burnBreakdown: { category: string; amount: number; percentage: number }[];
  keyObservations: string[];
  recommendations: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Indian format currency parsing fallback
// ─────────────────────────────────────────────────────────────────────────────

function parseCashBalance(range: string): number {
  if (!range) return 0;
  if (range.includes("Under ₹10L")) return 500_000;
  if (range.includes("₹10L-₹50L")) return 3_000_000;
  if (range.includes("₹50L-₹2Cr")) return 12_500_000;
  if (range.includes("₹2Cr-₹10Cr")) return 60_000_000;
  if (range.includes("₹10Cr+")) return 150_000_000;
  
  const numericOnly = range.replace(/[^\d]/g, "");
  if (numericOnly.length > 0) {
    return parseInt(numericOnly, 10);
  }
  return 0;
}

function fmt(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(0)}K`;
  return `₹${amount.toFixed(0)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Parser
// ─────────────────────────────────────────────────────────────────────────────

function parseReportText(text: string): ParsedReport {
  const result: ParsedReport = {
    financialSummary: [],
    burnBreakdown: [],
    keyObservations: [],
    recommendations: [],
  };

  if (!text) return result;

  const sections = text.split(/(FINANCIAL SUMMARY|BURN BREAKDOWN|KEY OBSERVATIONS|RECOMMENDATIONS)/i);

  let currentHeader = "";
  for (let i = 0; i < sections.length; i++) {
    const part = sections[i].trim();
    if (/^(FINANCIAL SUMMARY|BURN BREAKDOWN|KEY OBSERVATIONS|RECOMMENDATIONS)$/i.test(part)) {
      currentHeader = part.toUpperCase();
    } else if (currentHeader && part) {
      const lines = part.split("\n").map(l => l.trim()).filter(Boolean);

      if (currentHeader === "FINANCIAL SUMMARY") {
        lines.forEach(line => {
          const match = line.match(/^([^:|]+)[:|](.+)$/);
          if (match) {
            result.financialSummary.push({
              label: match[1].trim(),
              value: match[2].trim(),
            });
          }
        });
      } else if (currentHeader === "BURN BREAKDOWN") {
        lines.forEach(line => {
          const cleanLine = line.replace(/^[-*•\d.]\s*/, "").trim();
          // regex to extract name, amount and percentage e.g. "Salaries: ₹5,00,000 (60%)"
          const match = cleanLine.match(/^([^:|]+)[:|]\s*(₹?[\d,]+)\s*(?:\(([\d.]+)%\))?/);
          if (match) {
            const amountVal = parseInt(match[2].replace(/[^\d]/g, ""), 10) || 0;
            const pctVal = parseFloat(match[3] || "0") || 0;
            result.burnBreakdown.push({
              category: match[1].trim(),
              amount: amountVal,
              percentage: pctVal,
            });
          }
        });
      } else if (currentHeader === "KEY OBSERVATIONS") {
        lines.forEach(line => {
          const clean = line.replace(/^[-*•\d.]\s*/, "").trim();
          if (clean) result.keyObservations.push(clean);
        });
      } else if (currentHeader === "RECOMMENDATIONS") {
        lines.forEach(line => {
          const clean = line.replace(/^[-*•\d.]\s*/, "").trim();
          if (clean) result.recommendations.push(clean);
        });
      }
    }
  }

  // Sort burn breakdown by amount descending just in case
  result.burnBreakdown.sort((a, b) => b.amount - a.amount);

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const router = useRouter();

  // ── States ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [briefExists, setBriefExists] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Local financial values for fallbacks
  const [localCash, setLocalCash] = useState(0);
  const [localSpend, setLocalSpend] = useState(0);
  const [localNetBurn, setLocalNetBurn] = useState(0);
  const [localRevenue, setLocalRevenue] = useState(0);
  const [localRunway, setLocalRunway] = useState(0);
  const [localZeroCash, setLocalZeroCash] = useState("");
  const [localCategories, setLocalCategories] = useState<{ category: string; amount: number; percentage: number }[]>([]);

  // Config parameters
  const [selectedType, setSelectedType] = useState<ReportType>("investor_update");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("this_month");

  // Output parameters
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportText, setReportText] = useState("");
  const [parsedReport, setParsedReport] = useState<ParsedReport | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Fetch Initial Data ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const sb = createClient();

      // 1. Auth check
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      // 2. Company check
      const { data: co } = await sb
        .from("companies")
        .select("id, name, sector")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!co) {
        router.replace("/onboarding");
        return;
      }
      setCompany(co);

      // 3. Stored brief check
      const { data: brief } = await sb
        .from("financial_briefs")
        .select("company_id")
        .eq("company_id", co.id)
        .limit(1)
        .maybeSingle();
      setBriefExists(!!brief);

      if (co) {
        // 4. Financials (for fallbacks)
        const { data: fin } = await sb
          .from("company_financials")
          .select("funding_stage, cash_balance_range, monthly_spend_range")
          .eq("company_id", co.id)
          .maybeSingle();

        // 5. Raw Transactions
        const { data: tx } = await sb
          .from("transactions")
          .select("amount, type, category")
          .eq("company_id", co.id);

        const allTx = tx || [];
        const debits = allTx.filter((t) => t.type === "debit");
        const credits = allTx.filter((t) => t.type === "credit");

        const selfReportedCash = parseCashBalance(fin?.cash_balance_range ?? "");
        const selfReportedSpend = parseCashBalance(fin?.monthly_spend_range ?? "");

        const totalDebits = debits.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalCredits = credits.reduce((sum, t) => sum + Number(t.amount), 0);

        // Simple span of 3 months or fallback
        const spanMonths = 3; 
        const calcSpend = totalDebits > 0 ? (totalDebits / spanMonths) : selfReportedSpend;
        const calcRevenue = totalCredits > 0 ? (totalCredits / spanMonths) : 0;
        const calcNetBurn = Math.max(calcSpend - calcRevenue, 0);

        setLocalCash(selfReportedCash);
        setLocalSpend(calcSpend);
        setLocalNetBurn(calcNetBurn);
        setLocalRevenue(calcRevenue);

        const burnDivisor = calcNetBurn > 0 ? calcNetBurn : calcSpend > 0 ? calcSpend : 0;
        const computedRunway = selfReportedCash > 0 && burnDivisor > 0 ? (selfReportedCash / burnDivisor) : 0;
        setLocalRunway(computedRunway);

        if (computedRunway > 0) {
          const zc = new Date();
          zc.setMonth(zc.getMonth() + Math.floor(computedRunway));
          setLocalZeroCash(zc.toLocaleDateString("en-IN", { month: "short", year: "numeric" }));
        } else {
          setLocalZeroCash("—");
        }

        // Category breakdown totals
        const catMap: Record<string, number> = {};
        debits.forEach((t) => {
          catMap[t.category] = (catMap[t.category] ?? 0) + Number(t.amount);
        });
        const totalCatSpend = Object.values(catMap).reduce((a, b) => a + b, 0) || 1;
        setLocalCategories(
          Object.entries(catMap)
            .map(([category, amount]) => ({
              category,
              amount,
              percentage: parseFloat(((amount / totalCatSpend) * 100).toFixed(1)),
            }))
            .sort((a, b) => b.amount - a.amount)
        );
      }

      setLoading(false);
    })();
  }, [router]);

  // ── Generation ────────────────────────────────────────────────────────────
  const generateReport = useCallback(async () => {
    if (!company) return;
    setIsGenerating(true);
    setErrorMsg("");
    setReportText("");
    setParsedReport(null);

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: selectedType,
          period: selectedPeriod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate report.");
      }

      if (data.response) {
        setReportText(data.response);
        setParsedReport(parseReportText(data.response));
      } else {
        throw new Error("No response content from AI engine.");
      }
    } catch (err: any) {
      console.error("[Reports] Error:", err);
      setErrorMsg(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [company, selectedType, selectedPeriod]);

  // ── Copy Clipboard ────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [reportText]);

  // ── Print PDF Handler ────────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Map Period Key to UI Text ─────────────────────────────────────────────
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "this_month":
        return "This Month";
      case "last_month":
        return "Last Month";
      case "last_3_months":
        return "Last 3 Months";
      case "last_6_months":
        return "Last 6 Months";
      default:
        return "This Month";
    }
  };

  const getReportTypeLabel = () => {
    switch (selectedType) {
      case "investor_update":
        return "Investor Update";
      case "burn_analysis":
        return "Burn Analysis";
      case "fundraising_brief":
        return "Fundraising Brief";
      default:
        return "Investor Update";
    }
  };

  // Helper to extract values or fall back
  const getSummaryValue = (term: string, fallback: string) => {
    if (!parsedReport || parsedReport.financialSummary.length === 0) return fallback;
    const found = parsedReport.financialSummary.find((item) =>
      item.label.toLowerCase().includes(term.toLowerCase())
    );
    return found ? found.value : fallback;
  };

  const finalSummaryRows = [
    { label: "Cash Position", val: getSummaryValue("cash", fmt(localCash)) },
    { label: "Monthly Spend (Gross)", val: getSummaryValue("monthly burn", fmt(localSpend)) },
    { label: "Net Burn", val: getSummaryValue("net burn", fmt(localNetBurn)) },
    { label: "Revenue", val: getSummaryValue("revenue", fmt(localRevenue)) },
    { label: "Runway", val: getSummaryValue("runway", localRunway > 0 ? `${localRunway.toFixed(1)} months` : "—") },
    { label: "Zero Cash Date", val: getSummaryValue("zero cash", localZeroCash) },
  ];

  const finalCategories =
    parsedReport && parsedReport.burnBreakdown.length > 0
      ? parsedReport.burnBreakdown
      : localCategories.slice(0, 6);

  return (
    <AppLayout
      title="Reports"
      subtitle="Generate investor-ready summaries in one click."
      activeTab="Reports"
    >
      {/* Dynamic Print Stylesheet Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
            background: none !important;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible;
            color: #000000 !important;
          }
          #printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
            padding: 30px;
            box-shadow: none !important;
            border: none !important;
          }
          .print-hide {
            display: none !important;
          }
          .bg-zinc-950, .bg-[#0f0f0f], .bg-[#171717] {
            background-color: #ffffff !important;
            border-color: #e5e7eb !important;
          }
          .text-zinc-400, .text-zinc-500, .text-zinc-600 {
            color: #374151 !important;
          }
          .border, .border-b, .border-t {
            border-color: #d1d5db !important;
          }
          .visual-bar-bg {
            background-color: #e5e7eb !important;
          }
          .visual-bar-fill {
            background-color: #4f46e5 !important;
          }
        }
      `}} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
          <p className="text-zinc-500 text-sm font-mono">Loading reports pane…</p>
        </div>
      ) : !briefExists ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center">
            <FileText className="h-6 w-6 text-zinc-500" />
          </div>
          <p className="text-zinc-500 text-sm text-center mt-6">
            Upload your bank statement during onboarding to initialize your company brief.
          </p>
          <button
            onClick={() => router.push("/onboarding")}
            className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 px-6 text-sm font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            Go to onboarding <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Workspace layout */
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* LEFT COLUMN: Report Display Area */}
          <div className="flex-1 w-full order-2 lg:order-1">
            {parsedReport ? (
              <div className="space-y-4">
                
                {/* Printable Report Panel */}
                <div
                  id="printable-report-area"
                  className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-8 shadow-2xl relative"
                >
                  {/* Header */}
                  <div className="border-b border-[#2a2a2a] pb-5 mb-6">
                    <h1 className="text-white text-xl font-bold uppercase tracking-tight">
                      {company?.name || "FiBrainAI Client"}
                    </h1>
                    <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                      <p className="text-zinc-400 text-sm font-mono">
                        {getReportTypeLabel()} • {getPeriodLabel()}
                      </p>
                      <p className="text-zinc-600 text-xs font-mono">
                        Generated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* SECTION 1: FINANCIAL SUMMARY */}
                  <div className="mb-8">
                    <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-3.5 font-mono font-semibold">
                      Financial Summary
                    </h3>
                    <div className="bg-[#0f0f0f] border border-[#2a2a2a]/60 rounded-xl overflow-hidden shadow-inner">
                      <table className="w-full text-left border-collapse">
                        <tbody>
                          {finalSummaryRows.map((row, idx) => (
                            <tr
                              key={row.label}
                              className={idx % 2 === 1 ? "bg-[#141414]" : "bg-transparent"}
                            >
                              <td className="px-5 py-3.5 text-zinc-400 text-xs border-b border-[#2a2a2a]/40">
                                {row.label}
                              </td>
                              <td className="px-5 py-3.5 text-white text-sm font-mono font-semibold text-right border-b border-[#2a2a2a]/40">
                                {row.val}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SECTION 2: BURN BREAKDOWN */}
                  {finalCategories.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-3.5 font-mono font-semibold">
                        Burn Breakdown • {getPeriodLabel()}
                      </h3>
                      <div className="bg-[#0f0f0f] border border-[#2a2a2a]/60 rounded-xl overflow-hidden p-4 shadow-inner space-y-4">
                        {finalCategories.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs font-mono gap-4"
                          >
                            <span className="text-zinc-400 w-24 truncate">{item.category}</span>
                            <div className="flex-1 flex items-center gap-3">
                              {/* Visual Progress Bar */}
                              <div className="flex-1 bg-zinc-800/80 visual-bar-bg h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-500 visual-bar-fill h-full rounded-full"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                              <span className="text-zinc-650 w-8 text-right shrink-0">{item.percentage}%</span>
                            </div>
                            <span className="text-white font-semibold w-24 text-right">
                              {fmt(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTION 3: KEY OBSERVATIONS */}
                  {parsedReport.keyObservations.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-3.5 font-mono font-semibold">
                        Key Observations
                      </h3>
                      <ul className="space-y-3 pl-1">
                        {parsedReport.keyObservations.map((obs, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                            <span className="text-zinc-300 text-xs md:text-sm leading-relaxed font-light">
                              {obs}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* SECTION 4: RECOMMENDATIONS */}
                  {parsedReport.recommendations.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-3.5 font-mono font-semibold">
                        Recommendations
                      </h3>
                      <ol className="space-y-4 pl-1">
                        {parsedReport.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-3.5">
                            <div className="bg-indigo-950/60 border border-indigo-900/40 text-indigo-400 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-mono font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <span className="text-zinc-300 text-xs md:text-sm leading-relaxed font-light">
                              {rec}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {/* Sticky Export Action Bar */}
                <div className="bg-[#171717] border border-[#2a2a2a] p-4 rounded-xl flex items-center justify-between gap-4 print-hide">
                  <p className="text-zinc-500 text-xs font-mono">Report export options</p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={handleCopy}
                      className="cursor-pointer border border-[#2a2a2a] hover:bg-zinc-900 text-zinc-300 px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Clipboard className="h-3.5 w-3.5 text-zinc-400" />
                          Copy as text
                        </>
                      )}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/10"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Download PDF
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* Center Empty state */
              <div className="h-[460px] border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-zinc-900/10 print-hide">
                <FileText className="h-12 w-12 text-zinc-700" />
                <h4 className="text-zinc-300 text-sm font-semibold mt-4">Generate Financial Report</h4>
                <p className="text-zinc-500 text-xs mt-2 font-mono max-w-xs">
                  Select a report type and period context in the configuration panel, then click Generate.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Configuration Panel */}
          <div className="w-full lg:w-72 shrink-0 sticky top-8 print-hide order-1 lg:order-2">
            <div className="bg-[#171717] border border-[#2a2a2a] rounded-xl p-5 space-y-5">
              <div>
                <h3 className="text-white font-semibold text-sm">Generate Report</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">Select parameters</p>
              </div>

              {/* Type Selectors */}
              <div className="space-y-2">
                <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Report type</p>
                
                {/* Card 1: Investor Update */}
                <button
                  type="button"
                  onClick={() => setSelectedType("investor_update")}
                  className={`w-full text-left p-3.5 rounded-xl border flex gap-3 items-start cursor-pointer transition-all ${
                    selectedType === "investor_update"
                      ? "border-indigo-500 bg-indigo-500/10 text-white font-medium"
                      : "border-zinc-850 bg-[#0f0f0f] text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <FileText className={`h-4.5 w-4.5 mt-0.5 shrink-0 ${selectedType === "investor_update" ? "text-indigo-400" : "text-zinc-500"}`} />
                  <div>
                    <p className="text-xs text-white font-semibold leading-tight">Investor Update</p>
                    <p className="text-[10px] text-zinc-400 mt-1 font-light leading-normal">Board-ready financial summary</p>
                  </div>
                </button>

                {/* Card 2: Burn Analysis */}
                <button
                  type="button"
                  onClick={() => setSelectedType("burn_analysis")}
                  className={`w-full text-left p-3.5 rounded-xl border flex gap-3 items-start cursor-pointer transition-all ${
                    selectedType === "burn_analysis"
                      ? "border-indigo-500 bg-indigo-500/10 text-white font-medium"
                      : "border-zinc-850 bg-[#0f0f0f] text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <TrendingDown className={`h-4.5 w-4.5 mt-0.5 shrink-0 ${selectedType === "burn_analysis" ? "text-indigo-400" : "text-zinc-500"}`} />
                  <div>
                    <p className="text-xs text-white font-semibold leading-tight">Burn Analysis</p>
                    <p className="text-[10px] text-zinc-400 mt-1 font-light leading-normal">Deep dive into spending patterns</p>
                  </div>
                </button>

                {/* Card 3: Fundraising Brief */}
                <button
                  type="button"
                  onClick={() => setSelectedType("fundraising_brief")}
                  className={`w-full text-left p-3.5 rounded-xl border flex gap-3 items-start cursor-pointer transition-all ${
                    selectedType === "fundraising_brief"
                      ? "border-indigo-500 bg-indigo-500/10 text-white font-medium"
                      : "border-zinc-850 bg-[#0f0f0f] text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <DollarSign className={`h-4.5 w-4.5 mt-0.5 shrink-0 ${selectedType === "fundraising_brief" ? "text-indigo-400" : "text-zinc-500"}`} />
                  <div>
                    <p className="text-xs text-white font-semibold leading-tight">Fundraising Brief</p>
                    <p className="text-[10px] text-zinc-400 mt-1 font-light leading-normal">Metrics for your next raise</p>
                  </div>
                </button>
              </div>

              {/* Period Selectors */}
              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider block">Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                  className="w-full bg-[#0f0f0f] border border-zinc-850 rounded-lg px-3 py-2.5 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="this_month">This month</option>
                  <option value="last_month">Last month</option>
                  <option value="last_3_months">Last 3 months</option>
                  <option value="last_6_months">Last 6 months</option>
                </select>
              </div>

              {errorMsg && (
                <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] leading-relaxed font-mono">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={generateReport}
                disabled={isGenerating}
                className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg py-3.5 w-full flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    Generating...
                  </>
                ) : (
                  <>Generate Report</>
                )}
              </button>
            </div>
          </div>

        </div>
      )}
    </AppLayout>
  );
}
