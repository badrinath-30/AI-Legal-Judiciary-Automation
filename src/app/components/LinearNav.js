import Link from "next/link";

export default function LinearNav() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0B0C0E]/80 border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/landing" className="text-white font-display font-extrabold text-lg tracking-tight">LegalAI</Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#8F94A0]">
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/customers" className="hover:text-white transition-colors">Customers</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-[#8F94A0] hover:text-white transition-colors">Log in</Link>
          <Link href="/register" className="bg-white text-[#08090A] rounded-full px-4 py-1.5 font-medium hover:scale-[1.03] transition-transform text-xs">Sign up</Link>
        </div>
      </div>
    </nav>
  );
}
