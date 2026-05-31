"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  FileText,
  ArrowRight,
  Clipboard,
  Check,
  RefreshCw,
  Loader2,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import AppLayout from "@/src/components/layout/AppLayout";

type Company = {
  id: string;
  name: string;
};

type Snapshot = {
  id: string;
  month: string;
  gross_burn: number;
  total_revenue: number;
  net_burn: number;
  runway_months: number;
};

export default function ReportsPage() {
  const router = useRouter();

  // ── States ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [briefExists, setBriefExists] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [reportText, setReportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Fetch Data ────────────────────────────────────────────────────────────
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
        .select("id, name")
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

      // 4. Latest monthly snapshot
      const { data: snap } = await sb
        .from("monthly_snapshots")
        .select("id, month, gross_burn, total_revenue, net_burn, runway_months")
        .eq("company_id", co.id)
        .order("month", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (snap) setSnapshot(snap as Snapshot);

      setLoading(false);
    })();
  }, [router]);

  // ── Generation ────────────────────────────────────────────────────────────
  const generateReport = useCallback(async () => {
    if (!company) return;
    setIsGenerating(true);
    setErrorMsg("");
    setReportText("");

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate report.");
      }

      if (data.response) {
        setReportText(data.response);
      } else {
        throw new Error("Empty response received from AI backend.");
      }
    } catch (err: any) {
      console.error("[Reports] error generating:", err);
      setErrorMsg(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [company]);

  // ── Copy Clipboard ────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [reportText]);

  return (
    <AppLayout
      title="Reports"
      subtitle="Generate investor-ready summaries in one click."
      activeTab="Reports"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
          <p className="text-zinc-500 text-sm font-mono">Loading reports pane…</p>
        </div>
      ) : !briefExists ? (
        /* Empty onboarding redirection UI */
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <FileText className="h-6 w-6 text-zinc-500" />
          </div>
          <p className="text-zinc-500 text-sm text-center mt-6">
            Upload your bank statement during onboarding to initialize your company brief.
          </p>
          <button
            onClick={() => router.push("/onboarding")}
            className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 px-6 text-sm font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
          >
            Go to onboarding <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Reports generation workspace */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Action Trigger Card */}
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-indigo-400" />
              </div>
              <h2 className="text-white text-md font-semibold mt-4">
                Investor Update
              </h2>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-light">
                Draft a comprehensive, board-ready update mapping out opening cash, burn rates, runway forecasts, and operational anomalies automatically.
              </p>

              <button
                onClick={generateReport}
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl py-4.5 w-full mt-6 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-white" />
                    Generate Report
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs leading-relaxed font-mono">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Compiled Output View */}
          <div className="lg:col-span-2">
            {reportText ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Generated Content Box */}
                <div className="bg-[#0c0c0c] border border-zinc-800 rounded-2xl p-6 text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto shadow-inner">
                  {reportText}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleCopy}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-4 w-4 text-zinc-400" />
                        Copy to clipboard
                      </>
                    )}
                  </button>

                  <button
                    onClick={generateReport}
                    disabled={isGenerating}
                    className="flex-1 border border-zinc-700 hover:bg-zinc-900 text-zinc-400 rounded-xl py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                    Regenerate
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full border border-dashed border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-zinc-900/10 min-h-[300px]">
                <FileText className="h-8 w-8 text-zinc-700" />
                <p className="text-zinc-500 text-sm mt-3 font-light">
                  Your generated report will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
