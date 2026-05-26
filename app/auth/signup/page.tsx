"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { Cpu, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) { setError("Please enter your full name."); return; }
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            onboarding_completed: false,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("An account with this email already exists. Log in instead.");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/8 blur-[120px] pointer-events-none" />

      {/* Logo top-left */}
      <header className="relative z-10 px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 p-[1.5px] group-hover:shadow-lg group-hover:shadow-violet-600/20 transition-all">
            <div className="h-full w-full rounded-[10px] bg-neutral-950 flex items-center justify-center text-violet-400">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white group-hover:text-violet-300 transition-colors">
              FiBrainAI
            </span>
            <span className="text-[9px] font-mono font-bold text-violet-400 block -mt-0.5 uppercase tracking-widest">
              AI CFO
            </span>
          </div>
        </Link>
      </header>

      {/* Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[390px] space-y-8">

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-neutral-400 font-light">
              Takes 60 seconds.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-neutral-950/80 border border-neutral-800/60 rounded-2xl p-7 shadow-2xl backdrop-blur-sm space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Full name */}
              <div className="space-y-1.5">
                <label htmlFor="full-name" className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">
                  Full name
                </label>
                <input
                  id="full-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Naman Sahgal"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setError(""); }}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-600 font-sans focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all disabled:opacity-50"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">
                  Email address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="founder@yourstartup.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-600 font-mono focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    disabled={loading}
                    className="w-full px-4 py-3 pr-11 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-600 font-mono focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="text-[11px] font-mono text-neutral-500">
                    {8 - password.length} more character{8 - password.length !== 1 ? "s" : ""} needed
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs font-mono text-red-400 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-800" />
              <span className="text-[11px] font-mono text-neutral-600">or</span>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-neutral-500">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="text-center text-[11px] font-mono text-neutral-600 leading-relaxed px-2">
            By creating an account you agree to our{" "}
            <span className="text-neutral-500 hover:text-violet-400 transition-colors cursor-pointer">Terms of Service</span>
            {" "}and{" "}
            <span className="text-neutral-500 hover:text-violet-400 transition-colors cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
