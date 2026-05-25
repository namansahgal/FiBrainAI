import React from 'react';
import { 
  GraduationCap, 
  Code,
  Sparkles,
  Mail
} from 'lucide-react';

// Inline SVG icons for platforms not in this lucide-react version
const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
import { JOURNEY_TIMELINE } from '../data';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-16 px-4">
      
      {/* Title & Founder Cover */}
      <section className="text-left pt-12 md:pt-16 space-y-4">
        <span className="font-mono text-xs text-violet-400 uppercase tracking-widest block font-bold">
          The Founder Behind FiBrainAI
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Who is building this?
        </h1>
        <p className="text-neutral-400 text-lg max-w-2xl font-light">
          A 23-year-old software engineer building in public beside a full-time job. Tracing the raw, honest journey of creating a startup.
        </p>
      </section>

      {/* Profile and Bio Grid */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        
        {/* Profile Card */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl glass text-center space-y-4 shadow-xl">
          <div className="relative">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-ping" />
            
            {/* Photo frame */}
            <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 p-[2.5px] shadow-lg shadow-violet-500/25">
              {/* 
                ── PHOTO PLACEHOLDER ────────────────────────────────────────────
                Replace the <div> below with:
                <img
                  src="/naman.jpg"         ← drop your photo in /public/naman.jpg
                  alt="Naman Sahgal"
                  className="h-full w-full rounded-full object-cover"
                />
                ─────────────────────────────────────────────────────────────── 
              */}
              <div className="h-full w-full rounded-full bg-neutral-900 flex items-center justify-center flex-col text-white font-mono overflow-hidden">
                <span className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">
                  NS
                </span>
                <span className="text-[9px] text-violet-400 font-bold uppercase tracking-widest mt-0.5">
                  Photo Soon
                </span>
              </div>
            </div>

            {/* Badge */}
            <span className="absolute -bottom-1 right-0 bg-violet-600 border border-violet-500 text-[10px] text-white px-2 py-0.5 rounded-full font-mono font-medium shadow-md whitespace-nowrap">
              Founder
            </span>
          </div>

          {/* Name */}
          <div className="space-y-0.5">
            <h3 className="text-lg font-bold text-white">Naman Sahgal</h3>
            <p className="text-xs font-mono text-neutral-400">Founder, FiBrainAI · 23 y/o</p>
          </div>

          {/* Social Links */}
          <div className="pt-3 border-t border-white/5 w-full space-y-2">
            <a
              href="mailto:naman@fibrainai.com"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 border border-white/8 hover:border-violet-500/40 hover:bg-violet-950/20 transition-all group"
            >
              <Mail className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <span className="text-xs font-mono text-neutral-400 group-hover:text-white transition-colors truncate">
                naman@fibrainai.com
              </span>
            </a>

            <a
              href="https://www.linkedin.com/in/naman-sahgal-97634b1aa/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 border border-white/8 hover:border-violet-500/40 hover:bg-violet-950/20 transition-all group"
            >
              <LinkedinIcon className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <span className="text-xs font-mono text-neutral-400 group-hover:text-white transition-colors truncate">
                linkedin.com/in/naman-sahgal
              </span>
            </a>

            <a
              href="https://x.com/Naman2399364"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 border border-white/8 hover:border-violet-500/40 hover:bg-violet-950/20 transition-all group"
            >
              <XIcon className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <span className="text-xs font-mono text-neutral-400 group-hover:text-white transition-colors truncate">
                @Naman2399364
              </span>
            </a>
          </div>
        </div>

        {/* Bio */}
        <div className="md:col-span-8 text-left space-y-6">
          <div className="p-8 rounded-2xl glass space-y-5 shadow-lg">
            <h2 className="text-lg font-mono text-violet-400 uppercase tracking-wider font-semibold">
              The Mission Statement
            </h2>
            
            <p className="text-neutral-200 leading-relaxed font-light text-base italic font-serif pl-4 border-l-2 border-violet-500/40">
              "I'm <span className="text-white font-sans font-bold not-italic">Naman Sahgal</span>. I'm 23, working a full-time job, and building in public by night. I kept watching startups around me make complex financial decisions blind — no CFO, no real analytical tools, just gut feeling and an external accountant who only shows up much too late to file the taxes."
            </p>

            <p className="text-neutral-350 leading-relaxed font-light text-base">
              "So I'm building <strong className="text-white">FiBrainAI</strong>. An intelligent AI agency that gives startup founders and businesses world-class, CFO-level financial intelligence from day one without paying corporate salary premiums."
            </p>

            <div className="pt-4 flex flex-wrap gap-4 text-xs text-neutral-400 font-mono border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-violet-400" />
                <span>Full-Time Software Job</span>
              </div>
              <span className="text-neutral-800">•</span>
              <div className="flex items-center gap-1.5">
                <Code className="h-4 w-4 text-violet-400" />
                <span>Building in Public</span>
              </div>
              <span className="text-neutral-800">•</span>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span>Zero-Mock Integrity</span>
              </div>
            </div>
          </div>

          {/* Contact CTA card */}
          <div className="p-5 rounded-2xl border border-violet-800/20 bg-violet-950/10 space-y-3">
            <p className="text-sm font-mono text-violet-300 font-semibold">Want to connect?</p>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Whether you are a founder facing a financial blind spot, a potential co-founder, or just following the journey — reach out directly. I reply to every message.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="mailto:naman@fibrainai.com"
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-600/30 text-violet-300 hover:bg-violet-600/30 transition-colors"
              >
                <Mail className="h-3 w-3" /> Email Me
              </a>
              <a
                href="https://www.linkedin.com/in/naman-sahgal-97634b1aa/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-600/30 text-violet-300 hover:bg-violet-600/30 transition-colors"
              >
                <LinkedinIcon className="h-3 w-3" /> LinkedIn
              </a>
              <a
                href="https://x.com/Naman2399364"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-600/30 text-violet-300 hover:bg-violet-600/30 transition-colors"
              >
                <XIcon className="h-3 w-3" /> X / Twitter
              </a>
            </div>
          </div>
        </div>

      </section>

      {/* Timeline Section */}
      <section className="text-left space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-white">
            Our Journey So Far
          </h2>
          <p className="text-neutral-500 text-sm font-light">
            Tracing how a night-shift builder is designing the next-gen financial agency.
          </p>
        </div>

        <div className="relative border-l border-neutral-800 ml-4 pl-8 space-y-12 py-3">
          
          {JOURNEY_TIMELINE.map((item, idx) => {
            const isDone = item.status === 'done';
            const isCurrent = item.status === 'current';
            
            return (
              <div key={item.id} className="relative group">
                
                {/* Bullet */}
                <div className={`absolute -left-[41px] h-6 w-6 rounded-full border transition-all flex items-center justify-center ${
                  isDone 
                    ? 'bg-violet-950 border-violet-500 text-violet-400' 
                    : isCurrent 
                      ? 'bg-neutral-900 border-violet-400 text-violet-300 animate-pulse'
                      : 'bg-[#0f0f0f] border-neutral-800 text-neutral-600'
                }`}>
                  <span className="text-[9px] font-mono font-bold">{idx + 1}</span>
                </div>

                {/* Content */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-violet-400 font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                      {item.period}
                    </span>
                    {isCurrent && (
                      <span className="flex h-2 w-2 rounded-full bg-violet-400" />
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-sm text-neutral-400 font-light leading-relaxed max-w-xl">
                    {item.description}
                  </p>
                </div>

              </div>
            );
          })}

        </div>
      </section>

    </div>
  );
}
