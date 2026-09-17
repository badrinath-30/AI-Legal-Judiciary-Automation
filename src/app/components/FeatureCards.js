"use client";

import { motion } from "framer-motion";

const figures = [
  {
    tag: "FIG 0.1",
    title: "Case Intelligence",
    desc: "Real-time tracking, status updates, and automated document retrieval powered by RAG.",
  },
  {
    tag: "FIG 0.2",
    title: "FIR Automation",
    desc: "Register, classify, and route FIRs instantly with role-based access controls.",
  },
  {
    tag: "FIG 0.3",
    title: "AI Assistant",
    desc: "Query legal statutes, past rulings, and procedural rules in natural language.",
  },
];

/* Minimal isometric wireframe SVG pattern */
function WireframeGraphic() {
  return (
    <svg viewBox="0 0 200 140" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wireGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <g stroke="url(#wireGrad)" strokeWidth="0.75" fill="none" strokeLinecap="round">
        {/* Cube body */}
        <path d="M40 95 L60 75 L100 75 L120 95 L100 115 L60 115 Z" />
        <path d="M60 75 L80 55 L120 55 L140 75" />
        <path d="M80 55 L80 95" />
        <path d="M120 55 L120 95" />
        <path d="M40 95 L60 115" />
        <path d="M140 75 L120 95" />
        {/* Top plane lines */}
        <path d="M80 55 L100 35 L140 35 L120 55" />
        <path d="M100 35 L100 75" />
        <path d="M140 35 L140 75" />
      </g>
      {/* Small detail dots */}
      <circle cx="60" cy="115" r="1.5" fill="#FFFFFF" opacity="0.6" />
      <circle cx="100" cy="115" r="1.5" fill="#FFFFFF" opacity="0.6" />
      <circle cx="120" cy="95" r="1.5" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
}

export default function FeatureCards() {
  return (
    <section id="features" className="relative bg-[#08090A] py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-10 bg-[#4E525D]" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#4E525D]">Features</span>
        </div>
        <h2 className="font-[Space_Grotesk] text-4xl sm:text-5xl font-bold text-white tracking-[-0.03em] mb-4 leading-tight">
          Everything, in one place.
        </h2>
        <p className="text-[#8F94A0] text-lg max-w-xl mb-16 leading-relaxed">
          A unified platform for courts, police, advocates, and citizens — built for speed, transparency, and scale.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {figures.map((fig, i) => (
            <motion.article
              key={fig.tag}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="group relative rounded-2xl bg-[#121316] border border-white/[0.06] p-7 hover:border-white/[0.12] transition-colors duration-300"
            >
              {/* Tag */}
              <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#4E525D] mb-6">
                {fig.tag}
              </div>

              {/* Wireframe graphic */}
              <div className="relative w-full h-44 mb-6 rounded-xl overflow-hidden bg-[#0D0E11] border border-white/[0.04] flex items-center justify-center group-hover:border-white/[0.1] transition-colors">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
                <div className="w-32 h-32 md:w-36 md:h-36 opacity-80 group-hover:scale-[1.05] transition-transform duration-500">
                  <WireframeGraphic />
                </div>
              </div>

              <h3 className="font-display text-xl font-bold text-white tracking-tight mb-2">
                {fig.title}
              </h3>
              <p className="text-[#8F94A0] text-sm leading-relaxed">{fig.desc}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
