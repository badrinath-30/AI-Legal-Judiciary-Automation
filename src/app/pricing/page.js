"use client";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";

const tiers = [
  { name: "Free", price: "$0", period: "/mo", desc: "Basic issue tracking for small teams.", btn: "Get started", btnClass: "bg-neutral-800 text-white hover:bg-neutral-700", popular: false, features: ["Up to 5 members", "Basic issue tracking", "Standard integrations", "Community support"] },
  { name: "Pro", price: "$12", period: "/user/mo", desc: "Advanced AI, custom workflows, unlimited history.", btn: "Start free trial", btnClass: "bg-white text-[#0B0C0E] hover:bg-neutral-200 shadow-sm hover:shadow-white/10", popular: true, features: ["Unlimited members", "AI assistant & insights", "Custom workflows", "Unlimited history", "Priority support", "SSO / SAML"] },
  { name: "Enterprise", price: "Custom", period: "", desc: "Dedicated support, advanced security, SLAs.", btn: "Contact sales", btnClass: "border border-white/30 text-white hover:bg-white/10", popular: false, features: ["Custom contracts", "Dedicated CSM", "Advanced audit logs", "On-prem option", "Custom AI training"] },
];

const table = [
  { cat: "Core Issue Tracking", free: true, pro: true, ent: true },
  { cat: "AI & Automation", free: false, pro: true, ent: true },
  { cat: "Custom Workflows", free: false, pro: true, ent: true },
  { cat: "Unlimited History", free: false, pro: true, ent: true },
  { cat: "SSO / SAML", free: false, pro: true, ent: true },
  { cat: "Dedicated CSM", free: false, pro: false, ent: true },
  { cat: "On-Prem Deploy", free: false, pro: false, ent: true },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0B0C0E] text-[#8F94A0] font-sans antialiased overflow-x-hidden selection:bg-white/20 selection:text-white">
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="font-sans text-4xl sm:text-6xl font-bold tracking-[-0.04em] mb-4 text-white">Simple, transparent pricing</h1>
        <div className="inline-flex items-center gap-4 bg-[#121318] border border-white/10 rounded-full px-2 py-1.5">
          <button className="rounded-full px-3 py-1 bg-white text-[#0B0C0E] text-xs font-medium">Monthly</button>
          <button className="rounded-full px-3 py-1 text-neutral-400 text-xs font-medium hover:text-white transition">Annual <span className="text-emerald-400">−20%</span></button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-5">
        {tiers.map((t) => (
          <motion.article key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`relative rounded-2xl p-8 ${t.popular ? "bg-[#121318] border border-white/30 shadow-[0_0_60px_-15px_rgba(255,255,255,0.08)]" : "bg-[#0D0E11] border border-neutral-800"}`}>
            {t.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest bg-white text-[#0B0C0E] rounded-full px-3 py-0.5">Most Popular</span>}
            <h3 className="font-sans text-xl font-bold mb-1 text-white">{t.name}</h3>
            <div className="flex items-baseline gap-1 mb-2"><span className="font-sans text-5xl font-bold tracking-tight text-white">{t.price}</span><span className="text-neutral-400 text-sm">{t.period}</span></div>
            <p className="text-sm text-neutral-400 mb-6">{t.desc}</p>
            <a href="/register" className={`inline-block w-full text-center rounded-full px-5 py-2.5 font-medium text-sm mb-8 ${t.btnClass}`}>{t.btn}</a>
            <ul className="space-y-3 text-sm text-neutral-400">{t.features.map(f => <li key={f} className="flex items-start gap-2.5"><Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />{f}</li>)}</ul>
          </motion.article>
        ))}
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="font-sans text-2xl font-bold tracking-tight mb-6 text-white">Compare all features</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0D0E11]">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 text-neutral-400 font-mono text-[11px] uppercase tracking-widest"><th className="px-6 py-3 text-left">Category</th><th className="px-6 py-3 text-center">Free</th><th className="px-6 py-3 text-center">Pro</th><th className="px-6 py-3 text-center">Enterprise</th></tr></thead>
            <tbody>
              {table.map((row, i) => (
                <tr key={row.cat} className={`border-b border-white/5 ${i % 2 === 1 ? "bg-white/[0.02]" : ""}`}>
                  <td className="px-6 py-3 font-medium text-white">{row.cat}</td>
                  <td className="px-6 py-3 text-center">{row.free ? <Check size={16} className="text-emerald-400 mx-auto" /> : <Minus size={16} className="text-neutral-600 mx-auto" />}</td>
                  <td className="px-6 py-3 text-center">{row.pro ? <Check size={16} className="text-emerald-400 mx-auto" /> : <Minus size={16} className="text-neutral-600 mx-auto" />}</td>
                  <td className="px-6 py-3 text-center">{row.ent ? <Check size={16} className="text-emerald-400 mx-auto" /> : <Minus size={16} className="text-neutral-600 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
