"use client";
import { motion } from "framer-motion";
import { Zap, Wifi, Sparkles, GitBranch } from "lucide-react";

export default function FeaturesPage() {
  const tabs = [
    { id: "keyboard", icon: Zap, title: "Keyboard First", desc: "⌘K to command. C to create. V to view. Every action is a keystroke away.", keys: ["⌘K", "C", "V", "⇧D"] },
    { id: "sync", icon: Wifi, title: "Instant Sync", desc: "Changes propagate instantly across clients with sub-50ms latency.", metrics: ["50ms", "99.99%", "Global"] },
    { id: "ai", icon: Sparkles, title: "AI Insights", desc: "Auto-suggest fixes, route issues, summarize diffs.", snippet: "suggest: fix typo in [auth.js]\n→ open PR #412" },
    { id: "workflow", icon: GitBranch, title: "Automated Workflows", desc: "GitHub PRs automatically update issue status.", flow: ["PR Opened →", "Review →", "Merged → Status Updated"] },
  ];

  return (
    <main className="min-h-screen bg-[#0B0C0E] text-[#8F94A0] font-sans antialiased overflow-x-hidden selection:bg-white/20 selection:text-white">
      <section className="relative pt-32 pb-16 px-6 bg-gradient-to-b from-[#121318]/60 to-[#0B0C0E]">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-sans text-4xl sm:text-6xl font-bold tracking-[-0.04em] leading-[1.05] mb-6 text-white">Built for speed. <span className="text-[#70757E]">Engine for scale.</span></h1>
          <p className="text-[#8F94A0] text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">Keyboard-first navigation, instant sync, and AI-native automation — designed for teams that move fast.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-[minmax(320px,auto)]">
          <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:col-span-2 md:row-span-2 rounded-2xl bg-[#0E0F12] border border-white/10 p-8 sm:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[rgba(120,119,198,0.1)] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
            <div className="text-xs font-mono tracking-[0.15em] text-neutral-500 uppercase mb-3">Keyboard First</div>
            <h2 className="font-sans text-3xl font-bold tracking-tight mb-3 text-white">Navigate at the speed of thought</h2>
            <p className="text-neutral-400 leading-relaxed mb-8 max-w-xl">Every action is a keystroke away. ⌘K opens command palette. C creates. V views. No mouse required.</p>
            <div className="flex gap-3 flex-wrap">{["⌘K", "C", "V", "⇧D"].map(k => <kbd key={k} className="px-3 py-1.5 rounded-md bg-[#161720] border border-white/10 text-neutral-200 font-mono text-sm shadow-inner">{k}</kbd>)}</div>
          </motion.article>

          <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl bg-[#0E0F12] border border-white/10 p-8 relative card-hover">
            <div className="text-xs font-mono tracking-[0.15em] text-neutral-500 uppercase mb-4">Instant Sync</div>
            <h3 className="font-sans text-2xl font-bold tracking-tight mb-2 text-white">Real-time, everywhere</h3>
            <p className="text-neutral-400 text-sm mb-6">Sub-50ms latency with 99.99% uptime across regions.</p>
            <div className="flex gap-6"><div><div className="text-2xl font-sans font-bold text-white">50ms</div><div className="text-[10px] font-mono text-neutral-500 uppercase">Latency</div></div><div><div className="text-2xl font-sans font-bold text-white">99.99%</div><div className="text-[10px] font-mono text-neutral-500 uppercase">Uptime</div></div><div><div className="text-2xl font-sans font-bold text-white">Global</div><div className="text-[10px] font-mono text-neutral-500 uppercase">Reach</div></div></div>
          </motion.article>

          <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl bg-[#0E0F12] border border-white/10 p-8 relative card-hover">
            <div className="text-xs font-mono tracking-[0.15em] text-neutral-500 uppercase mb-4">AI Insights</div>
            <h3 className="font-sans text-2xl font-bold tracking-tight mb-2 text-white">Pull requests, triaged</h3>
            <p className="text-neutral-400 text-sm mb-6">Auto-suggest fixes and route issues automatically.</p>
            <div className="rounded-lg bg-[#0B0C0E] border border-white/10 p-3 font-mono text-xs text-neutral-400 leading-relaxed">suggest: fix typo in [auth.js]\n→ open PR #412</div>
          </motion.article>

          <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:col-span-2 rounded-2xl bg-[#0E0F12] border border-white/10 p-8 relative card-hover">
            <div className="text-xs font-mono tracking-[0.15em] text-neutral-500 uppercase mb-3">Automated Workflows</div>
            <h3 className="font-sans text-2xl font-bold tracking-tight mb-3 text-white">From PR to status update</h3>
            <p className="text-neutral-400 text-sm mb-6 max-w-2xl">GitHub PRs automatically update issue status via rules that run continuously — tickets never stall.</p>
            <div className="flex gap-3 flex-wrap">{["PR Opened →", "Review →", "Merged → Status Updated"].map(s => <span key={s} className="px-3 py-1.5 rounded-full bg-[#161720] border border-white/10 text-xs font-medium text-white">{s}</span>)}</div>
          </motion.article>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 space-y-24">
        {[
          { title: "Keyboard-first by design", align: "left", bullets: ["⌘K command palette", "Context-aware shortcuts", "Zero mouse dependency"], img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80" },
          { title: "Sync that never stalls", align: "right", bullets: ["Real-time collaboration", "Sub-50ms propagation", "Conflict-free editing"], img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80" },
        ].map((item) => (
          <div key={item.title} className={`flex flex-col md:flex-row gap-12 items-center ${item.align === "right" ? "md:flex-row-reverse" : ""}`}>
            <div className="flex-1"><div className="aspect-[4/3] rounded-2xl bg-[#121318] border border-white/10 overflow-hidden shadow-2xl"><img src={item.img} alt={item.title} className="w-full h-full object-cover opacity-70 mix-blend-luminosity hover:scale-105 transition-transform duration-700" /></div></div>
            <div className="flex-1">
              <div className="text-xs font-mono tracking-[0.15em] text-neutral-500 uppercase mb-3">Deep Dive</div>
              <h3 className="font-sans text-3xl font-bold tracking-tight mb-4 text-white">{item.title}</h3>
              <ul className="space-y-3">{item.bullets.map(b => <li key={b} className="flex items-center gap-3 text-neutral-400 text-sm"><span className="w-1 h-1 rounded-full bg-indigo-400" />{b}</li>)}</ul>
            </div>
          </div>
        ))}
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#121318] to-[#0B0C0E] border border-white/10 p-12 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-[rgba(120,119,198,0.2)] rounded-full blur-[80px]" />
          <div className="relative z-10 max-w-xl">
            <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">Start a free trial.</h2>
            <p className="text-neutral-400 mb-6">No credit card required. Full access for 14 days.</p>
            <a href="/register" className="inline-block bg-white text-[#0B0C0E] rounded-full px-7 py-3 font-medium text-sm hover:scale-[1.03] transition-transform">Get Started Free</a>
          </div>
        </div>
      </section>
    </main>
  );
}
