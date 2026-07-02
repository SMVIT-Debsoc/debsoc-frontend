"use client";

import { ElegantShape } from "@/components/ui/shape-landing-hero";

/**
 * Ambient animated backdrop shared with the /session debate-mechanics page:
 * floating frosted-glass shapes over a soft blue glow. Fixed and
 * pointer-events-none so it never interferes with the dashboard content.
 */
export default function PairingBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <ElegantShape
        delay={0.3}
        width={600}
        height={140}
        rotate={12}
        gradient="from-indigo-500/[0.16]"
        className="left-[-12%] top-[8%]"
      />
      <ElegantShape
        delay={0.5}
        width={480}
        height={120}
        rotate={-15}
        gradient="from-blue-500/[0.14]"
        className="right-[-8%] top-[62%]"
      />
      <ElegantShape
        delay={0.4}
        width={300}
        height={80}
        rotate={-8}
        gradient="from-violet-500/[0.12]"
        className="left-[4%] bottom-[6%]"
      />
      <ElegantShape
        delay={0.6}
        width={220}
        height={64}
        rotate={20}
        gradient="from-sky-500/[0.12]"
        className="right-[14%] top-[12%]"
      />
    </div>
  );
}
