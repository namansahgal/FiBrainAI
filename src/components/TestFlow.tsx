import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  BarChart4, 
  CheckCircle2 
} from 'lucide-react';
import { createClient } from '../lib/supabase/client';

export default function TestFlow() {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

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

  const handleLaunch = async (path: 'onboarding' | 'dashboard') => {
    setLoading(true);
    setErrorMsg('');
    setLoadingStep('Generating guest session…');

    try {
      const supabase = createClient();

      // Sign out any active user first to prevent session mixups
      await supabase.auth.signOut().catch(() => {});

      // 1. Generate temp credentials
      const email = `guest-${Math.random().toString(36).substring(2, 12)}@fibrainai.com`;
      const password = `guest-pass-${Math.random().toString(36).substring(2, 10)}`;

      // 2. Sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: "Guest Founder",
            onboarding_completed: false,
            is_demo_user: true
          }
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      const user = signUpData?.user;
      if (!user) {
        throw new Error("Failed to create authenticated guest user.");
      }

      if (path === 'onboarding') {
        // Option A: Just redirect to onboarding page and let user experience it
        setLoadingStep('Redirecting to Onboarding…');
        setTimeout(() => {
          window.location.href = '/onboarding';
        }, 800);
      } else {
        // Option B: Set up everything in the background and jump to dashboard
        setLoadingStep('Creating guest company profile…');
        
        // Post onboarding complete
        const companyRes = await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: "Acme Corp (Demo)",
            sector: "B2B SaaS for HR teams",
            companyAge: "1-2 years",
            teamSize: "8 people",
            primaryPainPoint: "I don't know exactly how long my runway is",
            fundingStage: "Seed",
            cashBalanceRange: "₹65,00,000",
            monthlySpendRange: "₹8,40,000"
          })
        });

        if (!companyRes.ok) {
          const companyErr = await companyRes.json();
          throw new Error(companyErr.error ?? "Failed to create demo company profile.");
        }

        const { company_id } = await companyRes.json();
        if (!company_id) {
          throw new Error("Invalid demo company profile returned.");
        }

        setLoadingStep('Parsing & categorising sample statements…');
        const file = new File([sampleCSVContent], "demo-statement.csv", { type: "text/csv" });
        const formData = new FormData();
        formData.append("file", file);
        formData.append("company_id", company_id);
        formData.append("sector", "B2B SaaS for HR teams");
        formData.append("teamSize", "8 people");
        formData.append("fundingStage", "Seed");
        formData.append("cashRange", "₹65,00,000");

        const parseRes = await fetch("/api/parse-statement", {
          method: "POST",
          body: formData
        });

        if (!parseRes.ok) {
          const parseErr = await parseRes.json();
          throw new Error(parseErr.error ?? "Failed to parse demo statements.");
        }

        setLoadingStep('Activating real-time indicators…');
        await supabase.auth.updateUser({
          data: { onboarding_completed: true }
        });

        setLoadingStep('Redirecting to Dashboard…');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      }
    } catch (err: any) {
      console.error("[TestFlow] error launching guest session:", err);
      setErrorMsg(err.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-10 pb-20 px-4 text-left">
      <div className="space-y-4">
        <span className="font-mono text-xs text-indigo-400 uppercase tracking-widest block font-bold">
          ⚡ Interactive Product Testing
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          FiBrainAI Live Sandbox
        </h1>
        <p className="text-neutral-400 text-lg max-w-2xl font-light">
          Test the real deployed product end-to-end in real-time. Choose your entry point below to spawn a secure, isolated sandbox company.
        </p>
      </div>

      {loading ? (
        <div className="bg-[#111] border border-neutral-900 rounded-2xl p-10 mt-10 text-center flex flex-col items-center justify-center min-h-[300px] space-y-6">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
          <div className="space-y-1">
            <p className="text-white text-sm font-semibold">{loadingStep}</p>
            <p className="text-zinc-500 text-xs font-mono">This spins up a clean database ledger block</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          
          {/* Card 1: Interactive Onboarding Walkthrough */}
          <div className="bg-[#171717] border border-[#2a2a2a] hover:border-neutral-700 rounded-2xl p-8 flex flex-col justify-between transition-all group">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-[1.03] transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Full Onboarding Flow</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Experience our 6-step desktop company profile setup. Upload statements (or auto-fill with sample ledgers), watch the checklist categorize transactions, and verify the insight generator.
              </p>
            </div>
            <button
              onClick={() => handleLaunch('onboarding')}
              className="cursor-pointer bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white font-semibold text-sm py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-8 w-full shadow-sm"
            >
              Start Onboarding Flow
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Card 2: Instant Dashboard Preview */}
          <div className="bg-[#171717] border border-[#2a2a2a] hover:border-neutral-700 rounded-2xl p-8 flex flex-col justify-between transition-all group">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-[1.03] transition-transform">
                <BarChart4 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Instant Dashboard Preview</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                Bypass the setup wizards. Creates a guest company ledger populated with a sample transaction statement. Check out Runway gauges, monthly spend Recharts, and Gemini CFO Chat instantly.
              </p>
            </div>
            <button
              onClick={() => handleLaunch('dashboard')}
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-8 w-full shadow-lg shadow-indigo-600/10"
            >
              Launch Live Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}

      {errorMsg && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-mono flex items-center gap-2 max-w-xl">
          <ShieldCheck className="h-4 w-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="mt-12 text-center text-zinc-650 text-xs font-mono flex items-center justify-center gap-1.5 flex-wrap">
        <span>Protected Sandbox Environment</span>
        <span>•</span>
        <span>Isolated ledger blocks</span>
        <span>•</span>
        <span>Data resets on logout</span>
      </div>
    </div>
  );
}
