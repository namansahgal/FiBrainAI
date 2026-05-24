import React from 'react';
import { 
  GraduationCap, 
  Code,
  Sparkles
} from 'lucide-react';
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
        
        {/* Glowing Monogram Avatar / Photo Placeholder */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl glass text-center space-y-4 shadow-xl">
          <div className="relative">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full bg-violet-500/15 animate-ping" />
            
            {/* Avatar frame */}
            <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 p-1 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <div className="h-full w-full rounded-full bg-neutral-950 flex items-center justify-center flex-col text-white font-mono">
                <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">NS</span>
                <span className="text-[9px] text-violet-400 font-bold uppercase tracking-widest mt-0.5">23 Y/O</span>
              </div>
            </div>
            
            {/* Location badge on avatar */}
            <span className="absolute -bottom-1 right-1 bg-violet-600 border border-violet-500 text-[10px] text-white px-2 py-0.5 rounded-full font-mono font-medium flex items-center gap-0.5 shadow-md">
              Full-time Job
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Naman Sahgal</h3>
            <p className="text-xs font-mono text-neutral-400">Founder, FiBrainAI</p>
          </div>

          <div className="pt-2 border-t border-white/5 w-full flex justify-center gap-3 text-neutral-450">
            <a 
              href="mailto:namansahgal03@gmail.com" 
              className="p-1 px-2 text-xs font-mono hover:text-white transition-colors bg-white/5 border border-white/10 rounded hover:border-violet-500/30 flex items-center gap-1"
            >
              Email
            </a>
            <span className="text-neutral-800">|</span>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-1 px-2 text-xs font-mono hover:text-white transition-colors bg-white/5 border border-white/10 rounded hover:border-violet-500/30 flex items-center gap-1"
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* Dynamic Bio Paragraphs */}
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
