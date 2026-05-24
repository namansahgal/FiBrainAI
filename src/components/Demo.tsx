import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Cpu
} from 'lucide-react';
import { CONVERSATION_DEMOS } from '../data';

export default function Demo() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [displayText, setDisplayText] = useState<string>('');
  const [currentDemo, setCurrentDemo] = useState(CONVERSATION_DEMOS[0]);

  // Load selected demo
  useEffect(() => {
    setIsTyping(true);
    setDisplayText('');
    
    const targetDemo = CONVERSATION_DEMOS[activeTab];
    setCurrentDemo(targetDemo);

    // Dynamic text typing effect simulation
    let currentLength = 0;
    const fullText = targetDemo.response.summary;
    const typingInterval = setInterval(() => {
      if (currentLength < fullText.length) {
        setDisplayText(fullText.substring(0, currentLength + 2));
        currentLength += 2;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 15);

    return () => clearInterval(typingInterval);
  }, [activeTab]);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16 px-4">
      
      {/* Header */}
      <section className="text-left pt-12 md:pt-16 space-y-4">
        <span className="font-mono text-xs text-violet-400 uppercase tracking-widest block font-bold">
          Interactive Product Demo
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          FiBrainAI Sandbox
        </h1>
        <p className="text-neutral-400 text-lg max-w-2xl font-light">
          Experience how our AI CFO engine maps corporate raw ledgers into plain-English answers, actionable runway summaries, and clean-cut calculations.
        </p>
      </section>

      {/* Grid: Console + Presets */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Preset Queries Panel (Left 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-mono uppercase text-neutral-500 tracking-wider">
            Select Live CFO Scenarios
          </h3>
          
          <div className="flex flex-col gap-3">
            {CONVERSATION_DEMOS.map((demo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  activeTab === idx 
                    ? 'bg-violet-950/20 border-violet-800/60 text-white shadow-md' 
                    : 'bg-neutral-950/40 border-neutral-900 text-neutral-450 hover:border-neutral-800/80 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 h-4.5 w-4.5 rounded-md flex items-center justify-center shrink-0 text-xs font-mono ${
                    activeTab === idx ? 'bg-violet-500 text-white' : 'bg-neutral-900 border border-neutral-800 text-neutral-600'
                  }`}>
                    0{idx + 1}
                  </div>
                  <span className="text-xs sm:text-sm font-medium leading-relaxed">
                    "{demo.prompt}"
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-neutral-950/30 border border-neutral-900 space-y-2">
            <h4 className="text-xs font-mono text-neutral-400 uppercase flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-violet-400" />
              Engine Intelligence
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              This sandbox simulates our parsing engine, analyzing write-only company ledger records without manual spreadsheets.
            </p>
          </div>
        </div>

        {/* Live Simulator Panel (Right 8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden flex flex-col flex-grow shadow-2xl">
            
            {/* Terminal Window Chrome Headers */}
            <div className="bg-[#0e0e0e] border-b border-neutral-900 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/85 block" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/85 block" />
                <span className="h-3 w-3 rounded-full bg-green-500/85 block" />
                <span className="text-[10px] sm:text-xs font-mono text-neutral-500 ml-2">FiBrainAI Live Engine Terminal</span>
              </div>
              <span className="text-[9px] font-mono uppercase bg-violet-950 text-violet-400 px-2 py-0.5 rounded border border-violet-850">
                Sandbox Mode
              </span>
            </div>

            {/* Terminal Screen Body */}
            <div className="p-6 flex-grow space-y-6 font-mono text-xs sm:text-sm min-h-[380px] flex flex-col justify-between">
              
              <div className="space-y-6">
                
                {/* Prompt Question */}
                <div className="flex gap-2.5 items-start">
                  <span className="text-violet-400 font-bold shrink-0">user@startup:~$</span>
                  <p className="text-white font-sans text-sm sm:text-base leading-relaxed bg-neutral-900/60 px-3.5 py-2.5 rounded-xl border border-neutral-900 max-w-xl">
                    {currentDemo.prompt}
                  </p>
                </div>

                {/* AI CFO Stream Response */}
                <div className="flex gap-2.5 items-start">
                  <span className="text-neutral-500 font-bold shrink-0 text-right">fibrain_cfo:~$</span>
                  <div className="space-y-4 flex-grow max-w-xl">
                    
                    {/* Raw typed response summary */}
                    <div className="text-neutral-300 font-sans leading-relaxed text-sm whitespace-pre-line">
                      {displayText}
                      {isTyping && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-violet-400 animate-pulse" />
                      )}
                    </div>

                    {/* Conditional Metrics Box */}
                    {displayText && currentDemo.response.metrics && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-3 gap-3 pt-2"
                      >
                        {currentDemo.response.metrics.map((metric, i) => (
                          <div key={i} className="bg-neutral-900/50 p-3 rounded-lg border border-white/5 text-left">
                            <span className="block text-[9px] sm:text-[10px] text-neutral-500 uppercase font-mono tracking-wider font-semibold">
                              {metric.label}
                            </span>
                            <span className="block text-sm sm:text-base font-bold text-white mt-1">
                              {metric.value}
                            </span>
                            <span className={`inline-block text-[9px] font-mono rounded mt-0.5 px-1 py-0.2 font-bold ${
                              metric.change.startsWith('-') || metric.change.startsWith('₹') 
                                ? 'text-emerald-400' 
                                : 'text-violet-400'
                            }`}>
                              {metric.change}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* Conditional Draft Box */}
                    {displayText && currentDemo.response.draft && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-neutral-900 p-4 rounded-xl border border-white/5 text-left max-w-full font-mono text-[10px] sm:text-xs text-neutral-400 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto"
                      >
                        <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/5 text-[9px] text-neutral-500 uppercase tracking-wider font-bold">
                          <span>Draft Output (Clipboard Ready)</span>
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 animate-pulse">Ready</span>
                        </div>
                        {currentDemo.response.draft}
                      </motion.div>
                    )}

                    {/* Insight Box */}
                    {displayText && currentDemo.response.insight && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="p-3 bg-violet-950/20 text-violet-300 rounded-lg border border-violet-900/30 font-sans text-xs flex gap-2 items-start"
                      >
                        <span className="shrink-0 text-violet-400">💡</span>
                        <p className="font-light leading-relaxed">{currentDemo.response.insight.replace("💡 ", "")}</p>
                      </motion.div>
                    )}

                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

      </section>

    </div>
  );
}
