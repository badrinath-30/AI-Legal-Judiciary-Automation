"use client";

import { motion } from "framer-motion";

const logos = [
  { label: "OpenAI", abbr: "OA" },
  { label: "Vercel", abbr: "V" },
  { label: "Figma", abbr: "F" },
  { label: "Cursor", abbr: "C" },
  { label: "Coinbase", abbr: "CB" },
  { label: "Linear", abbr: "L" },
];

export default function BrandWall() {
  return (
    <section className="relative bg-[#08090A] border-y border-white/[0.06] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#4E525D] mb-8 text-center">
          POWERING THE COMPANIES BUILDING THE FUTURE
        </p>

        <div className="flex flex-wrap justify-center items-center gap-x-14 gap-y-8">
          {logos.map((logo) => (
            <motion.a
              key={logo.label}
              href="#"
              whileHover={{ scale: 1.08, opacity: 1 }}
              className="opacity-60 hover:opacity-100 transition-opacity duration-300"
              aria-label={logo.label}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.08] flex items-center justify-center font-display font-bold text-sm text-[#F2F0E9] tracking-tight">
                  {logo.abbr}
                </div>
                <span className="font-display font-semibold text-[#E8E6E3] text-base tracking-tight hidden sm:inline">
                  {logo.label}
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
