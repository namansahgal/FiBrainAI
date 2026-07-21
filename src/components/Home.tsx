import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  MessageSquare, 
  BarChart3, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap
} from 'lucide-react';
import type { Page } from '../App';

interface HomeProps {
  onNavigate: (page: Page) => void;
  onSubmitWaitlist: (email: string, source: string) => void;
  isWaitlisted: boolean;
  waitlistCount?: number;
}

export default function Home({ onNavigate, onSubmitWaitlist, isWaitlisted, waitlistCount }: HomeProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [ctaEmail, setCtaEmail] = useState('');
  const [ctaError, setCtaError] = useState('');
  const [ctaSubmitted, setCtaSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please provide a valid email address'); return; }
    setError('');
    onSubmitWaitlist(email, 'hero');
    setEmail('');
  };

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctaEmail) { setCtaError('Please enter your email'); return; }
    if (!/\S+@\S+\.\S+/.test(ctaEmail)) { setCtaError('Please provide a valid email address'); return; }
    setCtaError('');
    onSubmitWaitlist(ctaEmail, 'cta');
    setCtaEmail('');
    setCtaSubmitted(true);
  };

  return (
    <div className="flex flex-col">
      
      {/* 1. Hero Section */}
      <section className="relative pt-12 md:pt-20 pb-20 px-4 max-w-5xl mx-auto bg-section-hero w-full" id="home-hero">
        {/* Glow Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Hero Left Column (Text & Main CTA) */}
          <div className="md:col-span-7 text-left space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-mono hover:border-violet-500/30 transition-colors"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              Currently in development — Join Waitlist
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1] font-sans"
            >
              Your AI CFO for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                Indian startups
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-xl leading-relaxed font-sans font-light"
            >
              Real-time burn, runway, and CFO-level insights without spreadsheets or expensive hires.
            </motion.p>

            {/* Waitlist Form UX */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="max-w-md"
            >
              <AnimatePresence mode="wait">
                {!isWaitlisted ? (
                  <form 
                    onSubmit={handleSubmit} 
                    className="flex flex-col sm:flex-row gap-2 relative z-10"
                    id="waitlist-form"
                  >
                    <input
                      id="waitlist-email"
                      type="email"
                      placeholder="founder@yourstartup.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono text-sm placeholder-neutral-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                    <button
                      id="waitlist-submit"
                      type="submit"
                      className="cursor-pointer bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm py-3 px-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-600/25 active:scale-98 whitespace-nowrap"
                    >
                      Join Waitlist
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <div 
                    className="py-4 px-5 border border-violet-850/20 bg-violet-950/15 rounded-xl text-left"
                    id="waitlist-success"
                  >
                    <p className="text-white font-bold text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-violet-400" />
                      You’re on the list. We’ll email you before launch.
                    </p>
                  </div>
                )}
              </AnimatePresence>
              
              {error && (
                <p id="waitlist-error" className="text-xs text-red-400 font-mono mt-2 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" /> {error}
                </p>
              )}

              <p className="text-[11px] font-mono text-neutral-500 mt-3">
                {waitlistCount || 156} founders already waiting • Built for Indian banking & tax realities
              </p>
            </motion.div>
          </div>

          {/* Hero Right Column (Dashboard Mockup) */}
          <div className="md:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Outer purple glow */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 blur-xl opacity-70" />
              <div className="relative rounded-2xl border border-white/10 bg-neutral-950/40 p-1.5 shadow-2xl group overflow-hidden">
                <img 
                  src="/dashboard_mockup.jpg" 
                  alt="FiBrainAI CFO Dashboard Mockup" 
                  className="rounded-xl w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Problem Section (Alternating shade) */}
      <section className="px-4 py-20 bg-section-problem border-y border-neutral-900/60 w-full" id="problem-section">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="max-w-3xl text-left space-y-3">
            <span className="font-mono text-xs text-violet-400 uppercase tracking-widest block font-bold">
              The Bootstrapped Reality
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Why early startups burn out.
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg font-light leading-relaxed max-w-2xl">
              As a founder in India, your options are split. You either hire a full-time CFO (which easily drains ₹1.5L - ₹3L a month from scarce seed capital), or you rely entirely on an external Chartered Accountant who only shows up to file taxes weeks after you've already burned the cash.
            </p>
          </div>

          {/* Localized reassurance note */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-violet-950 bg-violet-950/5 max-w-2xl text-left text-xs font-mono text-neutral-400">
            <ShieldCheck className="h-4 w-4 text-violet-400 shrink-0" />
            <span>No need to replace your CA; FiBrainAI augments them by providing daily analytics.</span>
          </div>

          {/* Clean bullet cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left border-b border-white/5 pb-12 mb-12">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-red-950/40 border border-red-800/20 flex items-center justify-center text-red-400">
                  <TrendingUp className="h-3.5 w-3.5 rotate-45" />
                </div>
                <h4 className="text-base font-bold text-white">Invisible Bleeding</h4>
              </div>
              <p className="text-sm text-neutral-400 font-light leading-relaxed">
                Duplicate SaaS seat escalations, un-optimized cloud bills, and delayed tax reserves that drain your cash runway silently.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-violet-950/40 border border-violet-800/20 flex items-center justify-center text-violet-400">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-base font-bold text-white">Decision Blindness</h4>
              </div>
              <p className="text-sm text-neutral-400 font-light leading-relaxed">
                Estimating if you can afford that next engineering senior based on bank balances rather than accurate pipeline models.
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="stat-card p-6 rounded-2xl text-left space-y-3">
              <div className="text-4xl md:text-5xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-violet-500">
                73%
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-bold">Failure Rate</h4>
                <p className="text-sm text-neutral-400 font-light">
                  Early-stage startups collapse due to unmanaged runway and cashflow.
                </p>
              </div>
            </div>

            <div className="stat-card p-6 rounded-2xl text-left space-y-3">
              <div className="text-4xl md:text-5xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                88%
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-bold">Can't Afford CFOs</h4>
                <p className="text-sm text-neutral-400 font-light">
                  Pre-series startups can’t justify professional CFO costs.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Features Section */}
      <section className="px-4 py-20 bg-section-features max-w-5xl mx-auto space-y-16 w-full" id="features-section">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-mono text-xs text-violet-400 uppercase tracking-widest font-bold">
            Product Features
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Automating the CFO ledger
          </h2>
          <p className="text-neutral-400 text-sm md:text-base font-light">
            We bypass manual CSV matching, formulas that crash Google Sheets, and slow financial timelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="glass p-8 rounded-2xl text-left space-y-6 flex flex-col justify-between hover:border-violet-500/25 transition-all duration-300 group">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-950/60 border border-violet-800/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                  Always-on burn tracking
                </h3>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed font-light">
                Securely stream write-only transaction logs. FiBrainAI constantly maps live outflow buckets, identifies subscription duplicates, tracks tax reserve percentages, and updates live runway daily.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <span className="text-[11px] font-mono text-neutral-500 italic">No manual sheets, no delays.</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass p-8 rounded-2xl text-left space-y-6 flex flex-col justify-between hover:border-violet-500/25 transition-all duration-300 group">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-950/60 border border-violet-800/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                  Weekly AI CFO brief
                </h3>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed font-light">
                Skip the complex sheets. Receive an elegant, plain-text summary of your startup’s financial trajectory. Know exactly what went up, what went down, and key insights to share with your board or partners.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <span className="text-[11px] font-mono text-neutral-500 italic">Delivered straight to WhatsApp / Slack</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass p-8 rounded-2xl text-left space-y-6 flex flex-col justify-between hover:border-violet-500/25 transition-all duration-300 group">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-950/60 border border-violet-800/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                  Ask your finances anything
                </h3>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed font-light">
                Need to understand if you can scale your dev ops next week? Ask FiBrainAI directly. Get exact runway impacts, budget analysis, or an executive pitch-ready investment report in seconds.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <span className="text-[11px] font-mono text-neutral-500 italic">Conversational Indian tax & banking compliance</span>
            </div>
          </div>

        </div>

        {/* Secondary Contextual CTA */}
        <div className="text-center pt-4">
          <button
            onClick={() => {
              const el = document.getElementById('final-waitlist');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-violet-400 hover:text-white bg-violet-950/15 border border-violet-900/60 hover:border-violet-500/30 px-5 py-2.5 rounded-xl transition-all shadow-inner"
          >
            See how FiBrainAI works — Join early access
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* 4. Founder Story & "Building in Public" (Alternating shade) */}
      <section className="px-4 py-20 bg-section-founder border-y border-neutral-900/60 w-full" id="founder-story">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          
          {/* Founder Bio Card */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start p-6 rounded-2xl bio-card text-center md:text-left space-y-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-ping" />
              
              <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 p-[2px] shadow-lg shadow-violet-500/25">
                <img
                  src="/naman.PNG"
                  alt="Naman Sahgal — Founder, FiBrainAI"
                  className="h-full w-full rounded-full object-cover object-top"
                />
              </div>

              <span className="absolute -bottom-1 right-0 bg-violet-600 border border-violet-500 text-[9px] text-white px-2 py-0.5 rounded-full font-mono font-medium shadow-md">
                Founder
              </span>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-white">Naman Sahgal</h3>
              <p className="text-xs font-mono text-neutral-400">Software Engineer & Night-builder</p>
            </div>

            <div className="w-full border-t border-white/5 pt-3 space-y-2 text-xs text-neutral-300 font-light text-left">
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                <span>Building transparently by night beside a full-time job.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                <span>Committed to absolute data integrity and zero-mock code.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                <span>Personally replies to every single query or validation request.</span>
              </div>
            </div>
          </div>

          {/* Follow the journey column */}
          <div className="md:col-span-7 text-left space-y-6">
            <span className="font-mono text-xs text-violet-400 uppercase tracking-widest block font-bold">
              Follow the journey live
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Watch an engineer build in public
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base font-light leading-relaxed">
              FiBrainAI is developed completely transparently. I share every code commit, API integration milestone, validation conversation, and dashboard design update in our logs. Test out the sandbox setup below.
            </p>
            
            {/* Journey buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onNavigate('test-flow')}
                className="cursor-pointer bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-5 py-3 text-sm font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-violet-600/15"
              >
                Try Sandbox & Test Flow
                <Sparkles className="h-4 w-4 text-violet-200" />
              </button>
              <button
                onClick={() => onNavigate('build-log')}
                className="cursor-pointer bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 rounded-xl px-5 py-3 text-sm font-medium transition-all flex items-center gap-1.5"
              >
                Read Build Logs
                <ArrowRight className="h-4 w-4 text-violet-400" />
              </button>
              <button
                onClick={() => onNavigate('about')}
                className="cursor-pointer bg-neutral-900/60 hover:bg-neutral-800 text-neutral-450 border border-neutral-850 rounded-xl px-4 py-3 text-sm font-medium transition-all"
              >
                Founder Story
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Final CTA Waitlist section */}
      <section className="px-4 py-20 max-w-4xl mx-auto w-full" id="final-waitlist">
        <div className="rounded-3xl p-8 sm:p-12 bg-neutral-900/10 border border-neutral-850 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-700/5 blur-[80px]" />
          
          <span className="font-mono text-xs text-violet-400 uppercase tracking-widest font-bold">
            Ready for runway clarity?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 mb-4">
            Secure your launch spot today
          </h2>
          <p className="text-neutral-400 text-sm max-w-lg mx-auto mb-8 font-light leading-relaxed">
            Get early notification before we deploy public beta credentials. No credit card required. Receive weekly startup burn briefings.
          </p>
          
          {/* CTA Waitlist Form */}
          <div className="max-w-md mx-auto pt-2">
            <AnimatePresence mode="wait">
              {isWaitlisted || ctaSubmitted ? (
                <motion.div
                  key="cta-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-2 border border-violet-850/20 bg-violet-950/15 p-5 rounded-2xl"
                  id="cta-waitlist-success"
                >
                  <div className="inline-flex p-2 bg-violet-950/60 text-violet-400 rounded-full border border-violet-800/20">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-white font-bold text-base">You’re on the list. We’ll email you before launch.</p>
                  <p className="text-neutral-400 text-xs font-mono">
                    Thanks for backing Naman Sahgal and FiBrainAI.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="cta-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleCtaSubmit}
                  className="space-y-3"
                  id="cta-waitlist-form"
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="cta-waitlist-email"
                      type="email"
                      placeholder="founder@yourstartup.com"
                      value={ctaEmail}
                      onChange={(e) => { setCtaEmail(e.target.value); setCtaError(''); }}
                      className="flex-grow px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono text-sm placeholder-neutral-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                    <button
                      id="cta-waitlist-submit"
                      type="submit"
                      className="cursor-pointer bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap hover:shadow-lg hover:shadow-violet-600/20 active:scale-98"
                    >
                      Join Waitlist <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  {ctaError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-red-400 font-mono flex items-center gap-1.5 text-left pl-1"
                    >
                      <AlertCircle className="h-3 w-3" /> {ctaError}
                    </motion.p>
                  )}
                  {waitlistCount && waitlistCount > 0 ? (
                    <p className="text-[11px] font-mono text-neutral-500">
                      {waitlistCount} founders already waiting • Augments your existing CA
                    </p>
                  ) : null}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

    </div>
  );
}
