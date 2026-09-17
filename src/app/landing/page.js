"use client";
import { motion } from "framer-motion";

const brandLogos = ["OpenAI", "Vercel", "Salesforce", "Figma", "CURSOR", "coinbase", "ramp"];

const svgIsometric = (variant) => {
  if (variant === "cube") return (
    <svg className="w-36 h-36 text-neutral-400 opacity-80" viewBox="0 0 200 200" fill="none">
      <path d="M60 70L100 50L140 70L100 90L60 70Z" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.05"/>
      <path d="M60 70V110L100 130V90L60 70Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M140 70V110L100 130V90L140 70Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M100 110L140 90L180 110L140 130L100 110Z" stroke="white" strokeWidth="1.5"/>
      <path d="M100 110V150L140 170V130L100 110Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
  if (variant === "steps") return (
    <svg className="w-36 h-36 text-neutral-400 opacity-80" viewBox="0 0 200 200" fill="none">
      <path d="M40 140L160 70" stroke="white" strokeWidth="2"/>
      <path d="M40 140L70 155L190 85L160 70L40 140Z" fill="white" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="60" y1="128" x2="60" y2="150" stroke="white" strokeWidth="1.5"/>
      <line x1="90" y1="110" x2="90" y2="132" stroke="white" strokeWidth="1.5"/>
      <line x1="120" y1="92" x2="120" y2="114" stroke="white" strokeWidth="1.5"/>
      <line x1="150" y1="74" x2="150" y2="96" stroke="white" strokeWidth="1.5"/>
    </svg>
  );
  return (
    <svg className="w-36 h-36 text-neutral-400 opacity-80" viewBox="0 0 200 200" fill="none">
      <path d="M100 30L160 65V135L100 170L40 135V65L100 30Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"/>
      <path d="M100 50L145 76V124L100 150L55 124V76L100 50Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M100 70L130 87V113L100 130L70 113V87L100 70Z" fill="white" fillOpacity="0.05" stroke="white" strokeWidth="1.5"/>
      <circle cx="100" cy="100" r="16" stroke="white" strokeWidth="1.5"/>
    </svg>
  );
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0B0C0E] text-[#8F94A0] font-sans antialiased overflow-x-hidden selection:bg-white/20 selection:text-white">

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(120,119,198,0.18)_0%,rgba(11,12,14,0)_70%)]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs font-mono text-neutral-400 mb-8 hover:border-white/20 transition-all cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>New — Loops</span>
            <span className="text-neutral-600">→</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-left md:text-center leading-[1.1] max-w-4xl mx-auto mb-6">
            <span className="text-white">A new species of product tool.</span>{" "}
            <span className="text-[#70757E]">Purpose-built for modern teams with AI workflows at its core, Linear sets a new standard for planning and building products.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base sm:text-lg text-[#8F94A0] max-w-2xl mx-auto mb-10 text-left md:text-center font-normal">
            Purpose-built for planning and building products. Designed for the AI era.
          </motion.p>

          {/* Workspace Mockup */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="relative mt-12 max-w-5xl mx-auto rounded-xl border border-white/10 bg-[#121318] p-2 sm:p-3 shadow-2xl" style={{ boxShadow: "0 0 50px -10px rgba(120, 119, 198, 0.15)" }}>
            <div className="rounded-lg bg-[#0B0C0E] border border-white/5 overflow-hidden text-left text-xs sm:text-sm font-sans">
              <div className="h-10 border-b border-white/5 bg-[#121318]/50 px-4 flex items-center justify-between text-neutral-400">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40 inline-block"></span>
                  <span className="ml-4 text-xs font-mono text-neutral-500">DRV-8852 Faster app launch</span>
                </div>
                <div className="flex items-center space-x-3 text-xs font-mono text-neutral-500">
                  <span>1 / 84</span><span>↑</span><span>↓</span>
                </div>
              </div>
              <div className="grid grid-cols-12 min-h-[420px]">
                <div className="col-span-3 border-r border-white/5 p-4 hidden md:block space-y-4 bg-[#0D0E11]">
                  <div className="flex items-center justify-between text-neutral-300 font-medium">
                    <span className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-indigo-400"></span><span>Linear Workspace</span></span>
                    <span className="text-xs text-neutral-500">⌘K</span>
                  </div>
                  <div className="space-y-1 text-xs text-neutral-400 font-medium pt-2">
                    <a href="#" className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-neutral-300"><span>⚡ Pulse</span></a>
                    <a href="#" className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-white/5"><span>📥 Inbox</span></a>
                    <a href="#" className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-white/5"><span>🎯 My Issues</span></a>
                    <a href="#" className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-white/5"><span>⚖️ Reviews</span></a>
                  </div>
                  <div className="pt-4 space-y-1 text-xs text-neutral-500 font-medium">
                    <div className="px-2 pb-1 text-[10px] uppercase font-mono tracking-wider text-neutral-600">Workspace</div>
                    <a href="#" className="block px-2.5 py-1.5 rounded-md hover:bg-white/5 text-neutral-400">Initiatives</a>
                    <a href="#" className="block px-2.5 py-1.5 rounded-md hover:bg-white/5 text-neutral-400">Projects</a>
                    <a href="#" className="block px-2.5 py-1.5 rounded-md hover:bg-white/5 text-neutral-400">Agent tasks</a>
                  </div>
                </div>
                <div className="col-span-12 md:col-span-9 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-mono text-yellow-500/90 mb-3">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      <span>DRV-8852 Faster app launch</span><span className="text-neutral-600">★</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">Faster app launch</h2>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                      Render UI before <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-neutral-200">vehicle_state</code> sync when minimum required state is present, instead of blocking on full refresh during iOS startup.
                    </p>
                    <div className="border-t border-white/5 pt-6 mt-6">
                      <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-3 block">Activity</span>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3 text-xs text-neutral-400">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-semibold text-[10px]">AI</div>
                          <div><span className="text-white font-medium">Linear Agent</span> created the issue via Slack on behalf of <span className="text-neutral-300">Karri</span> <span className="text-neutral-600">· 2min ago</span></div>
                        </div>
                        <div className="flex items-start space-x-3 text-xs text-neutral-400">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-semibold text-[10px]">PR</div>
                          <div><span className="text-white font-medium">Triage Intelligence</span> added labels <span className="px-1.5 py-0.5 rounded bg-white/5 text-neutral-300 border border-white/10">Performance</span> and <span className="px-1.5 py-0.5 rounded bg-white/5 text-neutral-300 border border-white/10">iOS</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 p-4 rounded-lg bg-[#161820] border border-white/10 flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-xs text-indigo-400 font-medium"><span>✨ Linear Opus 5</span></div>
                      <p className="text-xs text-neutral-300 font-mono">Pushed draft PR. Removed dimmed IDs — isItemDimmed now checks waitingStatusById directly.</p>
                    </div>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded text-neutral-400">⌘K to accept</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Brand Wall */}
      <section className="py-16 border-t border-white/5 bg-[#0B0C0E]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-500 mb-10">POWERING THE COMPANIES BUILDING THE FUTURE</h2>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-75">
            {brandLogos.map((l) => (
              <span key={l} className="text-xl md:text-2xl font-bold tracking-tight text-white hover:opacity-100 transition-opacity cursor-default">{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FIG Cards */}
      <section className="py-24 border-t border-white/5 bg-[#0B0C0E]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { tag: "FIG 0.1", title: "Purpose-built", desc: "Engineered from the ground up for speed, keyboard-first navigation, and zero latency.", svg: null },
              { tag: "FIG 0.2", title: "Powered by agents", desc: "Autonomous AI agents that triage issues, draft pull requests, and keep roadmap status up to date.", svg: "cube" },
              { tag: "FIG 0.3", title: "Designed for speed", desc: "Built for high-performing product teams where milliseconds directly impact execution quality.", svg: "steps" },
            ].map((c) => (
              <div key={c.tag} className="bg-[#0E0F12] border border-white/10 rounded-xl p-6 flex flex-col justify-between card-hover">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-6">{c.tag}</div>
                  <div className="h-56 w-full flex items-center justify-center rounded-lg bg-[#121318]/50 border border-white/5 mb-6 overflow-hidden">
                    {svgIsometric(c.svg)}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{c.title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 border-t border-white/5 bg-[radial-gradient(circle_at_50%_0%,rgba(120,119,198,0.18)_0%,rgba(11,12,14,0)_70%)]">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">Built for the next generation of products.</h2>
          <p className="text-neutral-400 text-base sm:text-lg max-w-xl mx-auto">Join thousands of modern product teams building software faster with Linear.</p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/register" className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 font-semibold px-6 py-3 rounded-full transition-all">Get started for free</a>
            <a href="#pricing" className="w-full sm:w-auto bg-white/5 text-white hover:bg-white/10 border border-white/10 font-semibold px-6 py-3 rounded-full transition-all">Talk to sales</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 bg-[#0B0C0E] text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 space-y-4">
            <a href="#" className="flex items-center space-x-2 text-white font-semibold"><span>Linear</span></a>
            <p className="text-neutral-500 max-w-xs leading-relaxed">Designed in San Francisco. Built for modern software teams around the world.</p>
          </div>
          <div>
            <h4 className="text-neutral-300 font-semibold mb-3">Product</h4>
            <ul className="space-y-2"><li><a href="#" className="hover:text-white transition-colors">Features</a></li><li><a href="#" className="hover:text-white transition-colors">Integrations</a></li><li><a href="#" className="hover:text-white transition-colors">Linear Asks</a></li><li><a href="#" className="hover:text-white transition-colors">Linear Insights</a></li><li><a href="#" className="hover:text-white transition-colors">Changelog</a></li></ul>
          </div>
          <div>
            <h4 className="text-neutral-300 font-semibold mb-3">Resources</h4>
            <ul className="space-y-2"><li><a href="#" className="hover:text-white transition-colors">Documentation</a></li><li><a href="#" className="hover:text-white transition-colors">API & Webhooks</a></li><li><a href="#" className="hover:text-white transition-colors">Community</a></li><li><a href="#" className="hover:text-white transition-colors">Status</a></li></ul>
          </div>
          <div>
            <h4 className="text-neutral-300 font-semibold mb-3">Company</h4>
            <ul className="space-y-2"><li><a href="#" className="hover:text-white transition-colors">About</a></li><li><a href="#" className="hover:text-white transition-colors">Careers</a></li><li><a href="#" className="hover:text-white transition-colors">Blog</a></li><li><a href="#" className="hover:text-white transition-colors">Privacy</a></li><li><a href="#" className="hover:text-white transition-colors">Terms</a></li></ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between pt-8 border-t border-white/5 text-neutral-600">
          <span>&copy; 2026 Linear Orbit Inc. All rights reserved.</span>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-neutral-400">Twitter</a><a href="#" className="hover:text-neutral-400">GitHub</a><a href="#" className="hover:text-neutral-400">YouTube</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
