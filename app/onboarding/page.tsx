"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  CloudUpload,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Check,
  Cpu,
  X,
  FileText,
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const AGES = [
  "Less than 6 months",
  "6-12 months",
  "1-2 years",
  "2-4 years",
  "4+ years",
];

const FUNDING_STAGES = [
  "Bootstrapped",
  "Friends & Family",
  "Angel funded",
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B+",
];

const PAIN_POINTS = [
  "I don't know exactly how long my runway is",
  "My burn is growing but I don't know what to cut",
  "I need to raise soon and my financials aren't clean",
  "Investors keep asking for updates and I struggle to prepare them",
  "I'm making hiring decisions without confidence",
  "I know the numbers but don't know what they mean",
  "Something else",
];

const PROCESSING_STEPS = [
  "Reading your financial data",
  "Categorising transactions",
  "Calculating burn rate",
  "Computing runway",
  "Detecting anomalies",
  "Generating insights",
];

// ─────────────────────────────────────────────────────────────────────────────
// Format Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatCurrency = (valStr: string) => {
  const clean = valStr.replace(/[^\d]/g, "");
  if (!clean) return "";
  const num = parseInt(clean, 10);
  return num.toLocaleString("en-IN");
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const widthPercent = (current / total) * 100;
  return (
    <div className="w-full mb-6">
      <div className="w-full bg-[#2a2a2a] h-1 rounded-full overflow-hidden">
        <div
          className="bg-indigo-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <p className="text-zinc-500 text-xs text-right mt-2 font-mono">
        Step {current} of {total}
      </p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2 font-mono">
      {children}
    </label>
  );
}

function ContinueBtn({
  onClick,
  disabled = false,
  loading = false,
  label = "Continue →",
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/25 mt-4"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  // ── Navigation state ────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Step 1: Company Profile ─────────────────────────────────────────────
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [companyAge, setCompanyAge] = useState("");
  const [teamSize, setTeamSize] = useState("");

  // ── Step 2: Financial Position ───────────────────────────────────────────
  const [fundingStage, setFundingStage] = useState("");
  const [cashBalance, setCashBalance] = useState("");
  const [monthlySpend, setMonthlySpend] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");

  // ── Step 3: What Keeps You Up ───────────────────────────────────────────
  const [painPoint, setPainPoint] = useState("");
  const [customPainPoint, setCustomPainPoint] = useState("");

  // ── Step 4: File Upload ──────────────────────────────────────────────────
  const [files, setFiles] = useState<File[]>([]);
  const [skippedUpload, setSkippedUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 5: Processing ───────────────────────────────────────────────────
  const [shownItems, setShownItems] = useState(0);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // ── Step 6: Save & Preview ───────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleAutoFill = () => {
    setCompanyName("Acme Corp (Demo)");
    setSector("B2B SaaS for HR teams");
    setCompanyAge("1-2 years");
    setTeamSize("8");
    setFundingStage("Seed");
    setCashBalance("65,00,000");
    setMonthlySpend("8,40,000");
    setMonthlyRevenue("2,50,000");
    setPainPoint("I don't know exactly how long my runway is");

    const sampleCSVContent = `Date,Description,Debit,Credit,Balance
01/05/2026,Opening Balance,,,500000
03/05/2026,AWS AMAZON WEB SERVICES,45000,,455000
05/05/2026,SALARY MAY 2026 NEFT,,280000,735000
07/05/2026,NOTION SUBSCRIPTION,4800,,730200
10/05/2026,SWIGGY FOOD ORDER,850,,729350
12/05/2026,GOOGLE ADS MAY,25000,,704350
15/05/2026,CLIENT PAYMENT NEFT,,75000,779350
18/05/2026,FIGMA SUBSCRIPTION,3200,,776150
20/05/2026,AWS AMAZON WEB SERVICES,38000,,738150
22/05/2026,UBER TRAVEL,1200,,736950
25/05/2026,ZOOM SUBSCRIPTION,2400,,734550
28/05/2026,RAPIDO AUTO,450,,734100`;

    const file = new File([sampleCSVContent], "sample-statement.csv", { type: "text/csv" });
    setFiles([file]);
  };

  // ── Auth Guard ───────────────────────────────────────────────────────────
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/auth/login?next=/onboarding");
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);

  // ── Step 5 Trigger & Animation ───────────────────────────────────────────
  useEffect(() => {
    if (step !== 5) return;

    if (files.length > 0 && !skippedUpload) {
      Promise.all(
        files.map((file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("sector", sector);
          formData.append("teamSize", `${teamSize} people`);
          formData.append("fundingStage", fundingStage);
          formData.append("cashRange", `₹${cashBalance}`);
          return fetch("/api/parse-statement", { method: "POST", body: formData })
            .then((r) => r.json())
            .catch(() => null);
        })
      ).then((results) => {
        const valid = results.find((r) => r && r.insight);
        if (valid) setAiInsight(valid.insight);
      });
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    PROCESSING_STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setShownItems(i + 1), 400 + i * 700)
      );
    });

    timers.push(
      setTimeout(
        () => setStep(6),
        400 + PROCESSING_STEPS.length * 700 + 900
      )
    );

    return () => timers.forEach(clearTimeout);
  }, [step, files, skippedUpload, sector, teamSize, fundingStage, cashBalance]);

  // ── File Upload Handlers ─────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const arr = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...arr]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const arr = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...arr]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const goToProcessing = (skipped: boolean) => {
    setSkippedUpload(skipped);
    setShownItems(0);
    setStep(5);
  };

  // ── Save/Complete API ────────────────────────────────────────────────────
  const saveOnboardingData = async () => {
    setSaving(true);
    setSaveError("");

    try {
      const finalPainPoint =
        painPoint === "Something else" ? customPainPoint.trim() : painPoint;

      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          sector,
          companyAge,
          teamSize: `${teamSize} people`,
          primaryPainPoint: finalPainPoint,
          fundingStage,
          cashBalanceRange: `₹${cashBalance}`,
          monthlySpendRange: `₹${monthlySpend}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save details. Please try again.");
      }

      const { company_id } = await res.json();

      if (files.length > 0 && !skippedUpload && company_id) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("company_id", company_id);
          formData.append("sector", sector);
          formData.append("teamSize", `${teamSize} people`);
          formData.append("fundingStage", fundingStage);
          formData.append("cashRange", `₹${cashBalance}`);

          await fetch("/api/parse-statement", { method: "POST", body: formData }).catch(
            () => {}
          );
        }
      }

      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });

      return company_id;
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
      return null;
    }
  };

  const handleGoToDashboard = async () => {
    const cid = await saveOnboardingData();
    if (cid) router.push("/dashboard");
  };

  const handleGoToBrain = async () => {
    const cid = await saveOnboardingData();
    if (cid) router.push("/brain");
  };

  // ── Validation checks ────────────────────────────────────────────────────
  const canStep1 =
    companyName.trim().length > 0 &&
    sector.trim().length > 0 &&
    companyAge &&
    teamSize.trim().length > 0;

  const canStep2 =
    fundingStage &&
    cashBalance.trim().length > 0 &&
    monthlySpend.trim().length > 0 &&
    monthlyRevenue.trim().length > 0;

  const canStep3 =
    painPoint === "Something else"
      ? customPainPoint.trim().length > 0
      : !!painPoint;

  const defaultInsight = `Based on what you've shared, here's where to focus first:

You're at ${fundingStage || "early"} stage with ${teamSize || "a small"} team building in ${sector || "your industry"}.

The most common financial blindspot for companies like yours: burn that looks controlled monthly but compounds silently in SaaS tools, cloud costs, and hiring overhead.

Your first action: Upload your bank statements and I'll show you exactly where your money is going — and what to cut first.`;

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* Ambient backgrounds */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[550px] h-[300px] bg-indigo-600/5 blur-[120px] pointer-events-none" />

      {/* Header Logo */}
      <header className="relative z-10 px-6 py-5 flex items-center">
        <div className="inline-flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-[1.5px]">
            <div className="h-full w-full rounded-[10px] bg-neutral-950 flex items-center justify-center text-indigo-400">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white">
              FiBrainAI
            </span>
            <span className="text-[9px] font-mono font-bold text-indigo-400 block -mt-0.5 uppercase tracking-widest">
              AI CFO
            </span>
          </div>
        </div>
      </header>

      {/* Centered Main Form Container */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-[560px] bg-[#171717] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
          
          {/* Top Progress bar */}
          {step !== 5 && <ProgressBar current={step} total={6} />}

          <AnimatePresence mode="wait">
            
            {/* ══════════════ STEP 1: Company Profile ══════════════ */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Company Profile
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1 font-light">
                      Help the AI CFO understand your business model.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    className="cursor-pointer text-[10px] font-mono bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    ⚡ Auto-fill Sample
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <FieldLabel>Company name</FieldLabel>
                    <input
                      type="text"
                      placeholder="e.g. Acme Technologies"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-600 transition-colors"
                    />
                  </div>

                  <div>
                    <FieldLabel>What do you build?</FieldLabel>
                    <input
                      type="text"
                      placeholder="e.g. B2B SaaS for HR teams, D2C skincare brand, Fintech app..."
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-600 transition-colors"
                    />
                    <p className="text-zinc-600 text-[10px] mt-1.5 font-mono leading-relaxed">
                      Describe briefly — helps the brain understand your business context
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>How old is the company?</FieldLabel>
                      <select
                        value={companyAge}
                        onChange={(e) => setCompanyAge(e.target.value)}
                        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none transition-colors appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="text-zinc-700">Select age</option>
                        {AGES.map((age) => (
                          <option key={age} value={age}>{age}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <FieldLabel>Current team size</FieldLabel>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          placeholder="8"
                          value={teamSize}
                          onChange={(e) => setTeamSize(e.target.value)}
                          className="w-24 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-600 transition-colors font-mono"
                        />
                        <span className="text-zinc-400 text-sm font-medium">people</span>
                      </div>
                    </div>
                  </div>
                </div>

                <ContinueBtn onClick={() => setStep(2)} disabled={!canStep1} />
              </motion.div>
            )}

            {/* ══════════════ STEP 2: Financial Position ══════════════ */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Financial Position
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1 font-light">
                    Enter rough estimations to set up baseline runway forecasts.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <FieldLabel>Funding stage</FieldLabel>
                    <select
                      value={fundingStage}
                      onChange={(e) => setFundingStage(e.target.value)}
                      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none transition-colors appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="text-zinc-700">Select round</option>
                      {FUNDING_STAGES.map((stage) => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>Approximate cash in bank</FieldLabel>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono">₹</span>
                      <input
                        type="text"
                        placeholder="65,00,000"
                        value={cashBalance}
                        onChange={(e) => setCashBalance(formatCurrency(e.target.value))}
                        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg pl-8 pr-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-600 transition-colors font-mono"
                      />
                    </div>
                    <p className="text-zinc-650 text-[10px] mt-1.5 font-mono">
                      Rough estimate is fine. This stays completely private.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Approximate monthly spend</FieldLabel>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono">₹</span>
                        <input
                          type="text"
                          placeholder="8,40,000"
                          value={monthlySpend}
                          onChange={(e) => setMonthlySpend(formatCurrency(e.target.value))}
                          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg pl-8 pr-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-600 transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Monthly revenue (if any)</FieldLabel>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono">₹</span>
                        <input
                          type="text"
                          placeholder="0"
                          value={monthlyRevenue}
                          onChange={(e) => setMonthlyRevenue(formatCurrency(e.target.value))}
                          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg pl-8 pr-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-600 transition-colors font-mono"
                        />
                      </div>
                      <p className="text-zinc-650 text-[10px] mt-1.5 font-mono">
                        Enter 0 if pre-revenue
                      </p>
                    </div>
                  </div>
                </div>

                <ContinueBtn onClick={() => setStep(3)} disabled={!canStep2} />
              </motion.div>
            )}

            {/* ══════════════ STEP 3: What Keeps You Up ══════════════ */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    What keeps you up at night?
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1 font-light">
                    Select your primary financial concern so the AI CFO can flag relevant insights.
                  </p>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {PAIN_POINTS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPainPoint(opt)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all leading-snug cursor-pointer ${
                        painPoint === opt
                          ? "border-indigo-500 bg-indigo-500/10 text-white font-medium"
                          : "border-zinc-800 bg-[#0f0f0f] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {painPoint === "Something else" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2 mt-4"
                  >
                    <FieldLabel>Tell us what&apos;s on your mind...</FieldLabel>
                    <textarea
                      placeholder="e.g. Navigating cash flow mismatches, managing large pending TDS refunds, or scaling CAC efficiency..."
                      rows={3}
                      value={customPainPoint}
                      onChange={(e) => setCustomPainPoint(e.target.value)}
                      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none placeholder:text-zinc-600 transition-colors resize-none font-sans"
                    />
                  </motion.div>
                )}

                <ContinueBtn onClick={() => setStep(4)} disabled={!canStep3} />
              </motion.div>
            )}

            {/* ══════════════ STEP 4: Upload Statement ══════════════ */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Feed the Brain
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1 font-light leading-relaxed">
                    Upload your last 3–6 months of bank statements. Uploading multiple statements helps the model detect patterns accurately.
                  </p>
                </div>

                {/* Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all min-h-[220px] flex flex-col justify-center items-center select-none ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-500/5 scale-[1.01]"
                      : "border-zinc-800 bg-[#0f0f0f] cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/10"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3 pointer-events-none">
                    <CloudUpload className="h-10 w-10 text-indigo-400" />
                    <p className="text-sm font-semibold text-zinc-300">
                      Drag & drop statement files here
                    </p>
                    <div className="flex gap-2.5 mt-0.5">
                      <span className="bg-zinc-900 text-zinc-500 border border-zinc-850 px-2 py-0.5 rounded text-[10px] font-mono">PDF</span>
                      <span className="bg-zinc-900 text-zinc-500 border border-zinc-850 px-2 py-0.5 rounded text-[10px] font-mono">CSV</span>
                      <span className="bg-zinc-900 text-zinc-500 border border-zinc-850 px-2 py-0.5 rounded text-[10px] font-mono">XLSX</span>
                    </div>
                    <p className="text-[11px] text-indigo-400 font-medium mt-1">
                      Or click to browse local files
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.xls,.xlsx,.csv"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                      Selected statements ({files.length})
                    </p>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {files.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-[#0f0f0f] border border-zinc-850 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            <div className="truncate">
                              <p className="text-xs text-zinc-200 truncate font-mono font-medium">
                                {f.name}
                              </p>
                              <p className="text-[9px] text-zinc-500 font-mono">
                                {formatBytes(f.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(idx);
                            }}
                            className="text-[10px] text-zinc-500 hover:text-red-400 font-mono cursor-pointer transition-colors px-2 py-1"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer labels */}
                <p className="text-center text-[10px] font-mono text-zinc-650 leading-normal">
                  All transaction data is isolated, encrypted, and remains strictly private.
                </p>

                {/* Option to skip */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFiles([]);
                      goToProcessing(true);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors cursor-pointer"
                  >
                    Skip for now → I&apos;ll upload later
                  </button>
                </div>

                <ContinueBtn
                  onClick={() => goToProcessing(false)}
                  disabled={files.length === 0}
                  label="Analyse my statements →"
                />
              </motion.div>
            )}

            {/* ══════════════ STEP 5: Processing Animation ══════════════ */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center pt-4 pb-6 space-y-8"
              >
                <div className="relative mt-2">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping scale-[1.8]" />
                  <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                </div>

                <div className="space-y-1.5 text-center">
                  <h3 className="text-lg font-bold text-white">
                    FiBrainAI is reading your financials
                  </h3>
                  <p className="text-xs text-zinc-500 font-light">
                    {skippedUpload
                      ? "Assembling financial context..."
                      : "Processing raw statement transactions..."}
                  </p>
                </div>

                {/* Modern Checklist */}
                <div className="w-full space-y-3.5 text-left border border-[#2a2a2a] bg-[#0f0f0f] p-6 rounded-xl">
                  {PROCESSING_STEPS.map((item, i) => {
                    const isCompleted = shownItems > i;
                    const isActive = shownItems === i;
                    return (
                      <div key={item} className="flex items-center gap-3">
                        <div className="h-5 w-5 flex items-center justify-center shrink-0">
                          {isCompleted ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : isActive ? (
                            <Loader2 className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium transition-colors duration-300 ${
                            isCompleted
                              ? "text-white"
                              : isActive
                              ? "text-zinc-300"
                              : "text-zinc-600"
                          }`}
                        >
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ══════════════ STEP 6: First Insight ══════════════ */}
            {step === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Your financial picture
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1 font-light">
                    Based on your data
                  </p>
                </div>

                {/* Clean insight block */}
                <div className="bg-[#0f0f0f] border border-[#2a2a2a] border-l-4 border-l-indigo-500 rounded-xl p-6 leading-relaxed text-zinc-300 text-sm whitespace-pre-line font-light max-h-[300px] overflow-y-auto pr-1">
                  {!skippedUpload && !aiInsight ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                      <p className="text-zinc-500 text-xs font-mono">Formulating AI review...</p>
                    </div>
                  ) : (
                    aiInsight ?? defaultInsight
                  )}
                </div>

                {saveError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs font-mono">
                    {saveError}
                  </div>
                )}

                {/* CTAs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    id="go-to-dashboard"
                    onClick={handleGoToDashboard}
                    disabled={saving}
                    className="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Saving profile...
                      </>
                    ) : (
                      <>
                        Go to dashboard
                        <ArrowRight className="h-4.5 w-4.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleGoToBrain}
                    disabled={saving}
                    className="cursor-pointer w-full border border-[#2a2a2a] text-zinc-300 hover:text-white hover:border-zinc-500 text-xs py-3.5 rounded-xl transition-all font-semibold flex items-center justify-center"
                  >
                    Ask the brain
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
