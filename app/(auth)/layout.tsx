import { ElegantShape } from "@/components/ui/shape-landing-hero";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex items-center justify-center relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* ── Sticky Geometric Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
          <ElegantShape
              delay={0.3}
              width={600}
              height={140}
              rotate={12}
              gradient="from-indigo-500/[0.15]"
              className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
          />
          <ElegantShape
              delay={0.5}
              width={500}
              height={120}
              rotate={-15}
              gradient="from-rose-500/[0.15]"
              className="right-[-5%] top-[70%] md:top-[75%]"
          />
          <ElegantShape
              delay={0.4}
              width={300}
              height={80}
              rotate={-8}
              gradient="from-violet-500/[0.15]"
              className="left-[5%] md:left-[10%] bottom-[10%]"
          />
          <ElegantShape
              delay={0.6}
              width={200}
              height={60}
              rotate={20}
              gradient="from-amber-500/[0.15]"
              className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
          />
          <ElegantShape
              delay={0.7}
              width={150}
              height={40}
              rotate={-25}
              gradient="from-cyan-500/[0.15]"
              className="left-[20%] md:left-[25%] top-[5%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80" />
      </div>
      
      <div className="relative z-10 w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
