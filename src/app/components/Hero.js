"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, ShieldCheck } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden bg-[#08090A] px-6 pt-28 pb-20">
      {/* Subtle radial glow behind text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6366F1]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto w-full text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[#8F94A0] border border-white/[0.08] rounded-full px-4 py-2 bg-white/[0.03] mb-10 backdrop-blur-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          New — Loops →
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-[Space_Grotesk] text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold leading-[0.95] tracking-[-0.035em] text-white mb-7"
        >
          Legal Intelligence{" "}
          <span className="text-[#70757E]">Rebuilt.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-[#8F94A0] text-lg sm:text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto mb-12 font-light tracking-[-0.01em]"
        >
          Automate case tracking, FIR management, and advocate bookings with an AI-native platform designed for courts, police, and legal professionals.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          <a
            href="/register"
            className="group relative inline-flex items-center gap-2.5 bg-white text-[#08090A] rounded-full px-7 py-3.5 font-medium text-sm tracking-tight hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200 shadow-[0_0_40px_-12px_rgba(255,255,255,0.25)]"
          >
            Get Started — It’s Free
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-colors duration-200"
          >
            Explore Features
          </a>
        </motion.div>

        {/* Workspace mockup card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-5xl w-full rounded-[24px] overflow-hidden border border-[#22242D] bg-[#121316]/80 backdrop-blur-xl shadow-2xl"
        >
          {/* Subtle inner glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-[#6366F1]/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Mockup header */}
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            <span className="ml-4 text-xs font-mono text-[#4E525D] tracking-tight">LegalAI — Case Dashboard</span>
          </div>

          {/* Mockup body — wireframe dashboard */}
          <div className="relative px-5 pb-6">
            {/* Sidebar */}
            <div className="flex gap-4">
              <aside className="w-44 shrink-0 space-y-1.5">
                <div className="h-9 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center px-3 gap-2">
                  <Zap size={14} className="text-[#8F94A0]" />
                  <span className="text-xs font-medium text-[#F2F0E9]">Overview</span>
                </div>
                <div className="h-9 rounded-lg flex items-center px-3 gap-2">
                  <ShieldCheck size={14} className="text-[#4E525D]" />
                  <span className="text-xs font-medium text-[#6B707A]">FIR Tracking</span>
                </div>
                <div className="h-9 rounded-lg flex items-center px-3 gap-2">
                  <ShieldCheck size={14} className="text-[#4E525D]" />
                  <span className="text-xs font-medium text-[#6B707A]">Case History</span>
                </div>
                <div className="h-9 rounded-lg flex items-center px-3 gap-2">
                  <ShieldCheck size={14} className="text-[#4E525D]" />
                  <span className="text-xs font-medium text-[#6B707A]">Advocates</span>
                </div>
              </aside>

              {/* Main area cards */}
              <main className="flex-1 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#0D0E11] border border-white/[0.06] p-4 h-32 shadow-inner">
                  <div className="text-[10px] font-mono text-[#4E525D] tracking-widest uppercase mb-3">Active Cases</div>
                  <div className="font-display text-3xl font-bold text-white tracking-tight mb-1">124</div>
                  <div className="h-1.5 w-20 bg-[#22242D] rounded-full overflow-hidden"><div className="h-full w-3/4 bg-emerald-400 rounded-full" /></div>
                </div>
                <div className="rounded-xl bg-[#0D0E11] border border-white/[0.06] p-4 h-32 shadow-inner">
                  <div className="text-[10px] font-mono text-[#4E525D] tracking-widest uppercase mb-3">Pending FIRs</div>
                  <div className="font-display text-3xl font-bold text-white tracking-tight mb-1">38</div>
                  <div className="h-1.5 w-20 bg-[#22242D] rounded-full overflow-hidden"><div className="h-full w-1/2 bg-amber-400 rounded-full" /></div>
                </div>
                <div className="rounded-xl bg-[#0D0E11] border border-white/[0.06] p-4 h-32 shadow-inner">
                  <div className="text-[10px] font-mono text-[#4E525D] tracking-widest uppercase mb-3">AI Queries</div>
                  <div className="font-display text-3xl font-bold text-white tracking-tight mb-1">2.1k</div>
                  <div className="h-1.5 w-20 bg-[#22242D] rounded-full overflow-hidden"><div className="h-full w-[90%] bg-indigo-400 rounded-full" /></div>
                </div>

                {/* Table row */}
                <div className="col-span-3 rounded-xl bg-[#0D0E11] border border-white/[0.06] p-3">
                  <div className="flex gap-3 items-center mb-2">
                    <div className="flex-1 h-2 bg-[#22242D] rounded-sm" />
                    <div className="w-24 h-2 bg-[#22242D] rounded-sm" />
                    <div className="w-20 h-2 bg-[#22242D] rounded-sm" />
                  </div>
                  <div className="flex gap-3 items-center text-[11px] font-mono text-[#4E525D]">
                    <span className="flex-1">Case #2026-A-0912</span>
                    <span className="w-24">Fraud / IPC 420</span>
                    <span className="w-20 text-emerald-400">In Progress</span>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
