"use client";
import { useState } from "react";
import { GitBranch as Github, Mail } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <main className="min-h-screen bg-[#0B0C0E] text-[#8F94A0] font-sans antialiased overflow-x-hidden selection:bg-white/20 selection:text-white">
      <div className="max-w-xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#121318] border border-white/10 mb-6"><Mail size={22} /></div>
        <h1 className="font-sans text-4xl sm:text-5xl font-bold tracking-[-0.04em] mb-3 text-white">Get in touch</h1>
        <p className="text-neutral-400 mb-10">We typically reply within a few hours.</p>

        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4 mb-14">
          <input type="email" placeholder="work@email.com" required className="w-full bg-[#121318] border border-[#22242A] rounded-xl px-5 py-3.5 text-white text-sm placeholder:text-neutral-600 focus:border-white focus:outline-none transition-colors" />
          <textarea rows={4} placeholder="How can we help?" className="w-full bg-[#121318] border border-[#22242A] rounded-xl px-5 py-3.5 text-white text-sm placeholder:text-neutral-600 focus:border-white focus:outline-none transition-colors resize-none" />
          <button type="submit" className="w-full bg-white text-[#0B0C0E] rounded-full py-3.5 font-medium text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform">{sent ? "Message sent" : "Send Message"}</button>
        </form>

        <div className="grid grid-cols-2 gap-3 mb-14">
          <a href="#" className="flex items-center justify-center gap-2 rounded-full bg-[#121318] border border-[#22242A] py-3 text-sm font-medium hover:border-white/30 transition"><Github size={18} /> GitHub</a>
          <a href="#" className="flex items-center justify-center gap-2 rounded-full bg-[#121318] border border-[#22242A] py-3 text-sm font-medium hover:border-white/30 transition"><Mail size={18} /> Email</a>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <a href="#" className="block bg-[#121318] border border-[#22242A] rounded-xl p-5 hover:border-white/20 transition"><div className="font-medium text-white mb-1">Documentation</div><div className="text-xs text-neutral-400">API & guides</div></a>
          <a href="#" className="block bg-[#121318] border border-[#22242A] rounded-xl p-5 hover:border-white/20 transition"><div className="font-medium text-white mb-1">API Status</div><div className="text-xs text-neutral-400">Live metrics</div></a>
          <a href="#" className="block bg-[#121318] border border-[#22242A] rounded-xl p-5 hover:border-white/20 transition"><div className="font-medium text-white mb-1">Join Discord</div><div className="text-xs text-neutral-400">Community</div></a>
        </div>
      </div>
    </main>
  );
}
