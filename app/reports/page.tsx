"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Cpu,
  FileText,
  Bell,
  Settings,
  ArrowRight,
  Clipboard,
  Check,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

  // ── Load data on mount ────────────────────────────────────────────────────
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

      // 2. Company lookup
      const { data: co } = await sb
        .from("companies")
        .select("id, name")
        .eq("user_id", user.id)
        .limit(1)
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

  // ── Report Generation ─────────────────────────────────────────────────────
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

  // ── Clipboard Copy ────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [reportText]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
          <p className="text-zinc-500 text-sm font-mono">Loading reports…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col text-white">
      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[390px] w-full mx-auto px-4 pt-8 pb-32">
        {/* Header */}
        <div>
          <h1 className="text-white text-xl font-bold">Reports</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Generate investor-ready summaries in one click
          </p>
        </div>

        {!briefExists ? (
          /* ── EMPTY STATE (No statement uploaded/onboarded) ─────────────── */
          <div className="flex flex-col items-center text-center mt-16 px-4">
            <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <FileText className="h-6 w-6 text-zinc-500" />
            </div>
            <p className="text-zinc-500 text-sm text-center mt-6">
              Upload a bank statement first
            </p>
            <button
              onClick={() => router.push("/onboarding")}
              className="mt-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 px-6 text-sm font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-violet-600/20"
            >
              Go to onboarding <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* ── MAIN REPORT CARD ─────────────────────────────────────────── */
          <div className="mt-6 space-y-6">
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800/50">
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <FileText className="h-8 w-8 text-violet-400" />
              </div>
              <h2 className="text-white text-lg font-semibold mt-3">
                Investor Update
              </h2>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                Complete board-ready financial summary. Generated in 90 seconds.
              </p>

              <button
                onClick={generateReport}
                disabled={isGenerating}
                className="bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:opacity-50 text-white rounded-xl py-4 w-full font-semibold mt-5 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-violet-600/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Report →"
                )}
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm leading-relaxed">
                {errorMsg}
              </div>
            )}

            {/* Report Display */}
            {reportText && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {reportText}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleCopy}
                    className="bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-800 text-zinc-300 rounded-xl py-3 w-full text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-4 w-4" />
                        Copy to clipboard
                      </>
                    )}
                  </button>

                  <button
                    onClick={generateReport}
                    disabled={isGenerating}
                    className="border border-zinc-700 hover:bg-zinc-900 active:bg-transparent text-zinc-400 rounded-xl py-3 w-full text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                    Regenerate
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* ── BOTTOM NAVIGATION ─────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800">
        <div className="max-w-[390px] mx-auto flex items-center justify-around px-2 py-3">
          {(
            [
              { href: "/dashboard", icon: LayoutDashboard, label: "Home", id: "nav-home" },
              { href: "/brain", icon: Cpu, label: "Brain", id: "nav-brain" },
              { href: "/reports", icon: FileText, label: "Reports", id: "nav-reports" },
              { href: "/dashboard#alerts", icon: Bell, label: "Alerts", id: "nav-alerts" },
              { href: "/settings", icon: Settings, label: "Settings", id: "nav-settings" },
            ] as { href: string; icon: React.ElementType; label: string; id: string }[]
          ).map(({ href, icon: Icon, label, id }) => (
            <Link
              key={id}
              id={id}
              href={href}
              className={`relative flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                href === "/reports"
                  ? "text-violet-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-mono">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
