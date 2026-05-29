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
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Reusable sub-components (file-scoped, not exported)
// ─────────────────────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i + 1 === current
              ? "w-6 h-2 bg-violet-500"
              : i + 1 < current
              ? "w-2 h-2 bg-violet-800"
              : "w-2 h-2 bg-zinc-800"
          }`}
        />
      ))}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
      {children}
    </p>
  );
}

function TextInput({
  id,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      id={id}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 font-sans focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all"
    />
  );
}

function PillSelector({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
            value === opt
              ? "bg-violet-500 border-violet-500 text-white shadow-sm shadow-violet-500/20"
              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function CardSelector({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all leading-snug ${
            value === opt
              ? "border-violet-500 bg-violet-500/10 text-white"
              : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
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
      className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 hover:shadow-violet-500/25"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SECTORS = ["SaaS", "D2C", "Marketplace", "Agency", "Deep Tech", "Other"];
const AGES = ["Under 1yr", "1-2yr", "2-4yr", "4yr+"];
const TEAM_SIZES = ["Just me", "2-5", "6-15", "15+"];

const FUNDING_STAGES = [
  "Bootstrapped",
  "Friends & Family",
  "Angel",
  "Pre-seed",
  "Seed",
  "Series A+",
];
const CASH_RANGES = [
  "Under ₹10L",
  "₹10L-₹50L",
  "₹50L-₹2Cr",
  "₹2Cr-₹10Cr",
  "₹10Cr+",
];
const SPEND_RANGES = ["Under ₹2L", "₹2L-₹8L", "₹8L-₹20L", "₹20L+"];

const PAIN_POINTS = [
  "I don't know exactly how long my runway is",
  "My burn is growing but I don't know what to cut",
  "I need to raise soon and my financials aren't clean",
  "Investors keep asking for updates and I struggle to prepare them",
  "I'm making hiring decisions without confidence",
  "I know the numbers but don't know what they mean",
];

const PROCESSING_STEPS = [
  "Transactions read and cleaned",
  "Categories identified",
  "Burn rate calculated",
  "Runway computed",
  "Anomalies scanned",
  "Benchmarking against similar Indian startups",
  "Generating your first insight",
];

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  // ── Navigation state ────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Step 1: Company identity ─────────────────────────────────────────────
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [companyAge, setCompanyAge] = useState("");
  const [teamSize, setTeamSize] = useState("");

  // ── Step 2: Financial position ───────────────────────────────────────────
  const [fundingStage, setFundingStage] = useState("");
  const [cashBalance, setCashBalance] = useState("");
  const [monthlySpend, setMonthlySpend] = useState("");

  // ── Step 3: Pain point ───────────────────────────────────────────────────
  const [painPoint, setPainPoint] = useState("");

  // ── Step 4: File upload ──────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [skippedUpload, setSkippedUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 5: Processing ───────────────────────────────────────────────────
  const [shownItems, setShownItems] = useState(0);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // ── Step 6: Save ─────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Auth guard on mount ──────────────────────────────────────────────────────
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/auth/login?next=/onboarding");
      else setAuthChecked(true);
    });
  }, [router]);

  // ── Step 5: Processing animation + optional API call ────────────────────
  useEffect(() => {
    if (step !== 5) return;

    // If file was uploaded, call the parse API in parallel with animation
    // Pass onboarding context so Claude generates a startup-specific insight
    if (file && !skippedUpload) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sector", sector);
      formData.append("teamSize", teamSize);
      formData.append("fundingStage", fundingStage);
      formData.append("cashRange", cashBalance);
      fetch("/api/parse-statement", { method: "POST", body: formData })
        .then((r) => r.json())
        .then((data) => setAiInsight(data.insight ?? null))
        .catch(() => setAiInsight(null));
    }

    // Animate checklist items — one every 800ms after 500ms initial delay
    const timers: ReturnType<typeof setTimeout>[] = [];
    PROCESSING_STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setShownItems(i + 1), 500 + i * 800)
      );
    });

    // Auto-advance to step 6 after all items + 1s pause
    timers.push(
      setTimeout(
        () => setStep(6),
        500 + PROCESSING_STEPS.length * 800 + 1000
      )
    );

    return () => timers.forEach(clearTimeout);
  }, [step, file, skippedUpload]);

  // ── File drag-and-drop ───────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  // ── Advance to processing (with or without file) ─────────────────────────
  const goToProcessing = (skipped: boolean) => {
    setSkippedUpload(skipped);
    setShownItems(0);
    setStep(5);
  };

  // ── Save to Supabase and redirect ────────────────────────────────────────
  const saveOnboardingData = async () => {
    setSaving(true);
    setSaveError("");

    try {
      // 1. Save company data via server-side API route
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          sector,
          companyAge,
          teamSize,
          primaryPainPoint: painPoint,
          fundingStage,
          cashBalanceRange: cashBalance,
          monthlySpendRange: monthlySpend,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save. Please try again.");
      }

      const { company_id } = await res.json();

      // 2. If file was uploaded, re-submit with company_id so transactions
      //    get persisted to the database (step 5 parsed without company_id)
      if (file && !skippedUpload && company_id) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("company_id", company_id);
        formData.append("sector", sector);
        formData.append("teamSize", teamSize);
        formData.append("fundingStage", fundingStage);
        formData.append("cashRange", cashBalance);
        // Fire and forget — don't block the redirect
        fetch("/api/parse-statement", { method: "POST", body: formData }).catch(
          () => {}
        );
      }

      // 3. Mark onboarding as complete in user metadata (client-side)
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });

      return company_id;
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setSaving(false);
      return null;
    }
  };

  const handleGoToDashboard = async () => {
    const companyId = await saveOnboardingData();
    if (companyId) router.push("/dashboard");
  };

  const handleGoToBrain = async () => {
    const companyId = await saveOnboardingData();
    if (companyId) router.push("/brain");
  };

  // ── Validation guards ────────────────────────────────────────────────────
  const canStep1 =
    companyName.trim().length > 0 && sector && companyAge && teamSize;
  const canStep2 = fundingStage && cashBalance && monthlySpend;
  const canStep3 = !!painPoint;

  // ── Default insight (shown when file was skipped) ────────────────────────
  const defaultInsight = `Based on what you've shared, here's where to focus first:

You're at ${fundingStage || "early"} stage with ${teamSize || "a small"} team building a ${sector || "startup"}.

The most common financial blindspot for companies like yours: burn that looks controlled monthly but compounds silently in SaaS tools, cloud costs, and hiring overhead.

Your first action: Upload your last 3 months of bank statements and I'll show you exactly where your money is going — and what to cut first.`;

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[280px] bg-violet-600/6 blur-[120px] pointer-events-none" />

      <main className="relative z-10 flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-[390px]">
          {/* Step indicator — hidden on step 5 (processing screen) */}
          {step !== 5 && <StepDots current={step} total={6} />}

          <AnimatePresence mode="wait">

            {/* ══════════════ STEP 1 — Company Identity ══════════════ */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="space-y-7"
              >
                <div>
                  <h1 className="text-[26px] font-extrabold text-white tracking-tight leading-snug">
                    Tell me about your company
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1.5 font-light">
                    This helps the brain think in context.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <FieldLabel>Company name</FieldLabel>
                    <TextInput
                      id="company-name"
                      placeholder="e.g. YourStartup, RazorpayX, Zepto"
                      value={companyName}
                      onChange={setCompanyName}
                    />
                  </div>

                  <div>
                    <FieldLabel>What do you build?</FieldLabel>
                    <PillSelector
                      options={SECTORS}
                      value={sector}
                      onChange={setSector}
                    />
                  </div>

                  <div>
                    <FieldLabel>Company age</FieldLabel>
                    <PillSelector
                      options={AGES}
                      value={companyAge}
                      onChange={setCompanyAge}
                    />
                  </div>

                  <div>
                    <FieldLabel>Team size</FieldLabel>
                    <PillSelector
                      options={TEAM_SIZES}
                      value={teamSize}
                      onChange={setTeamSize}
                    />
                  </div>
                </div>

                <ContinueBtn
                  onClick={() => setStep(2)}
                  disabled={!canStep1}
                />
              </motion.div>
            )}

            {/* ══════════════ STEP 2 — Financial Position ══════════════ */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="space-y-7"
              >
                <div>
                  <h1 className="text-[26px] font-extrabold text-white tracking-tight leading-snug">
                    Where do you stand financially?
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1.5 font-light">
                    Rough numbers are fine. This stays private.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <FieldLabel>Funding stage</FieldLabel>
                    <PillSelector
                      options={FUNDING_STAGES}
                      value={fundingStage}
                      onChange={setFundingStage}
                    />
                  </div>

                  <div>
                    <FieldLabel>Cash in bank right now</FieldLabel>
                    <PillSelector
                      options={CASH_RANGES}
                      value={cashBalance}
                      onChange={setCashBalance}
                    />
                  </div>

                  <div>
                    <FieldLabel>Monthly spend approx</FieldLabel>
                    <PillSelector
                      options={SPEND_RANGES}
                      value={monthlySpend}
                      onChange={setMonthlySpend}
                    />
                  </div>
                </div>

                <ContinueBtn
                  onClick={() => setStep(3)}
                  disabled={!canStep2}
                />
              </motion.div>
            )}

            {/* ══════════════ STEP 3 — Pain Point ══════════════ */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="space-y-7"
              >
                <div>
                  <h1 className="text-[26px] font-extrabold text-white tracking-tight leading-snug">
                    What&apos;s actually keeping you up at night?
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1.5 font-light">
                    Be honest. The brain works better when it knows.
                  </p>
                </div>

                <CardSelector
                  options={PAIN_POINTS}
                  value={painPoint}
                  onChange={setPainPoint}
                />

                <ContinueBtn
                  onClick={() => setStep(4)}
                  disabled={!canStep3}
                />
              </motion.div>
            )}

            {/* ══════════════ STEP 4 — Upload Bank Statement ══════════════ */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-[26px] font-extrabold text-white tracking-tight">
                    Feed the brain.
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1.5 font-light leading-relaxed">
                    Upload your last 3–6 months of bank statements. The more
                    data, the sharper the insights.
                  </p>
                </div>

                {/* Drop zone */}
                <div
                  onClick={() => !file && fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                    isDragging
                      ? "border-violet-500 bg-violet-500/5 scale-[1.01]"
                      : file
                      ? "border-emerald-600/50 bg-emerald-900/10 cursor-default"
                      : "border-zinc-700 bg-zinc-900 cursor-pointer hover:border-zinc-500 hover:bg-zinc-900/80"
                  }`}
                >
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                      <p className="text-sm font-mono text-emerald-400 break-all px-2">
                        {file.name}
                      </p>
                      <p className="text-xs text-zinc-600 font-mono">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <CloudUpload className="h-9 w-9 text-zinc-500" />
                      <p className="text-sm font-medium text-zinc-300">
                        Drop your bank statement here
                      </p>
                      <p className="text-xs text-zinc-500 font-mono">
                        PDF, XLS, XLSX, CSV supported
                      </p>
                      <p className="text-xs text-violet-400 mt-1">
                        Or click to browse
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.xls,.xlsx,.csv"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>

                {/* Supported banks */}
                <p className="text-center text-[11px] font-mono text-zinc-600 leading-relaxed">
                  HDFC · ICICI · SBI · Kotak · Axis · Yes Bank · Federal ·
                  IndusInd
                </p>

                {/* Skip link */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => goToProcessing(true)}
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Skip for now → I&apos;ll upload later
                  </button>
                </div>

                <ContinueBtn
                  onClick={() => goToProcessing(false)}
                  disabled={!file}
                  label="Analyse my finances →"
                />
              </motion.div>
            )}

            {/* ══════════════ STEP 5 — Brain Processing ══════════════ */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center pt-4 pb-8 space-y-10"
              >
                {/* Pulsing orb */}
                <div className="relative mt-4">
                  <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping scale-[2]" />
                  <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-600/30">
                    <div className="h-3.5 w-3.5 rounded-full bg-white/90" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-lg font-bold text-white">
                    FiBrainAI is reading your finances
                  </p>
                  <p className="text-sm text-zinc-400 font-light">
                    {skippedUpload
                      ? "Building your financial profile…"
                      : "Analysing your bank statement…"}
                  </p>
                </div>

                {/* Animated checklist */}
                <div className="w-full space-y-3.5 text-left">
                  {PROCESSING_STEPS.map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 6 }}
                      animate={
                        shownItems > i
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: 6 }
                      }
                      transition={{ duration: 0.28 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                          shownItems > i
                            ? "bg-emerald-500/15 border border-emerald-500/30"
                            : "bg-zinc-900 border border-zinc-800"
                        }`}
                      >
                        {shownItems > i && (
                          <Check className="h-3 w-3 text-emerald-400" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-mono transition-colors duration-300 ${
                          shownItems > i ? "text-emerald-400" : "text-zinc-700"
                        }`}
                      >
                        {item}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══════════════ STEP 6 — First Insight ══════════════ */}
            {step === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-[26px] font-extrabold text-white tracking-tight">
                    Your brain is ready.
                  </h1>
                  <p className="text-sm text-emerald-400 mt-1.5 font-mono">
                    Here&apos;s what I found in the first 60 seconds.
                  </p>
                </div>

                {/* Insight card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line font-light">
                    {aiInsight ?? defaultInsight}
                  </p>
                </div>

                {/* Error state */}
                {saveError && (
                  <p className="text-xs font-mono text-red-400 text-center bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">
                    {saveError}
                  </p>
                )}

                {/* CTA buttons */}
                <div className="space-y-3 pt-1">
                  <button
                    type="button"
                    id="go-to-dashboard"
                    onClick={handleGoToDashboard}
                    disabled={saving}
                    className="cursor-pointer w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving your profile…
                      </>
                    ) : (
                      <>
                        Go to dashboard{" "}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleGoToBrain}
                    disabled={saving}
                    className="cursor-pointer w-full border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-sm py-3.5 rounded-xl transition-all font-medium"
                  >
                    Ask the brain a question
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
