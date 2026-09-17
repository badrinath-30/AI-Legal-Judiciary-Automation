"use client";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export default function CustomersPage() {
  return (
    <main className="min-h-screen bg-[#0B0C0E] text-[#8F94A0] font-sans antialiased overflow-x-hidden selection:bg-white/20 selection:text-white">
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="font-sans text-4xl sm:text-6xl font-bold tracking-[-0.04em] leading-[1.05] mb-4 text-white">Built for teams that care about quality.</h1>
        <p className="text-neutral-400 text-lg max-w-xl mx-auto">Over 10,000 tech companies build on Linear. Here is what they say.</p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-3xl bg-[#121318] border border-white/10 p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[rgba(120,119,198,0.1)] rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3" />
          <div className="relative z-10">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 mb-4">Featured Case Study</div>
            <blockquote className="font-sans text-2xl sm:text-3xl font-bold tracking-tight mb-6 leading-snug text-white">“We went from 3-day cycles to same-day delivery. Linear changed how we think about software.”</blockquote>
            <div className="flex items-center gap-4 mb-8"><img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80" alt="CTO" className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10" /><div><div className="font-medium text-white">Alex Chen</div><div className="text-sm text-neutral-400">CTO, OpenAI</div></div></div>
            <div className="flex gap-8 text-sm font-mono text-neutral-400"><div><span className="text-2xl font-sans font-bold text-white block">3x</span>faster sprint cycles</div><div><span className="text-2xl font-sans font-bold text-white block">0ms</span>latency</div></div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: "OpenAI", impact: "3x faster sprint cycles", tag: "Engineering" },
            { name: "Vercel", impact: "Zero latency on deploys", tag: "DevOps" },
            { name: "Figma", impact: "Design-to-code in minutes", tag: "Product" },
          ].map((s) => (
            <motion.article key={s.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl bg-[#121318] border border-white/10 p-7 card-hover">
              <div className="font-sans text-xl font-bold mb-2 tracking-tight text-white">{s.name}</div>
              <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">{s.tag}</div>
              <p className="text-neutral-400 text-sm mb-4 leading-relaxed">{s.impact}</p>
              <a href="#" className="inline-flex items-center gap-1 text-sm font-medium text-white hover:underline">Read story <ArrowUpRight size={14} /></a>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="font-sans text-2xl font-bold tracking-tight mb-8 text-white">Wall of Love</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { author: "@linearuser", text: "Keyboard-first design is insane. I never want to use a mouse again.", metric: "1.2k likes" },
            { author: "@devspeed", text: "The dark theme alone makes working late feel good. Quality UX.", metric: "850 likes" },
            { author: "@foundertech", text: "AI suggestions are actually useful. Not just marketing fluff.", metric: "2.3k likes" },
          ].map((t) => (
            <div key={t.author} className="rounded-2xl bg-[#121318] border border-white/10 p-6">
              <div className="text-neutral-400 text-sm mb-3">{t.text}</div>
              <div className="flex justify-between items-center text-xs font-mono text-neutral-500"><span>{t.author}</span><span>{t.metric}</span></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
