"use client";

import { ArrowUpRight } from "lucide-react";
import Hero from "./components/Hero";
import BrandWall from "./components/BrandWall";
import FeatureCards from "./components/FeatureCards";

export default function LinearLanding() {
  return (
    <main className="min-h-screen bg-[#08090A] text-[#FFFFFF] font-sans selection:bg-white/10">
      <Hero />
      <BrandWall />
      <FeatureCards />

      {/* Minimal footer */}
      <footer className="bg-[#0D0E11] border-t border-white/[0.06] px-6 py-14">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div>
            <a href="/" className="font-display text-2xl font-extrabold text-white tracking-tight inline-block mb-3 hover:text-[#8F94A0] transition-colors">
              LegalAI
            </a>
            <p className="text-[#4E525D] text-sm max-w-xs leading-relaxed">
              AI-native legal automation for courts, police, and legal professionals.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-[#8F94A0]">
            <a href="#" className="hover:text-white transition-colors">Product</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-[#4E525D] font-mono tracking-tight">
          <span>© 2026 LegalAI. Built with Next.js.</span>
          <span className="flex items-center gap-1">Linear-style design · <ArrowUpRight size={10} /> Open Source</span>
        </div>
      </footer>
    </main>
  );
}
