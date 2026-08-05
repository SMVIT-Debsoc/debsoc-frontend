"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Children, useEffect, useRef, type ReactNode } from "react";

type AnalysisTransitionLayoutProps = {
  analysisActive: boolean;
  stacked?: boolean;
  children: ReactNode;
};

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function AnalysisTransitionLayout({ analysisActive, stacked = false, children }: AnalysisTransitionLayoutProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const resultRegionRef = useRef<HTMLDivElement>(null);
  const duration = reduceMotion ? 0.01 : 0.36;
  const [preparation, result] = Children.toArray(children);

  useEffect(() => {
    if (!analysisActive) return;
    resultRegionRef.current?.focus();
  }, [analysisActive]);

  return (
    <motion.div
      layout
      className={`grid min-w-0 gap-5 ${stacked ? "grid-cols-1" : analysisActive ? "xl:grid-cols-[minmax(0,calc(41%_-_32px))_minmax(0,calc(59%_+_32px))]" : "xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.7fr)]"}`}
      transition={{ layout: { duration, ease: easeOut } }}
    >
      <motion.div layout className="min-w-0" transition={{ layout: { duration, ease: easeOut } }}>
        {preparation}
      </motion.div>
      <motion.div
        layout
        ref={resultRegionRef}
        tabIndex={-1}
        aria-label="Analysis result"
        className="relative z-10 min-w-0 outline-none"
        animate={{ opacity: 1, x: analysisActive && !reduceMotion ? -4 : 0 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.32, ease: easeOut }}
      >
        {result}
      </motion.div>
    </motion.div>
  );
}

export function AnalysisResultReveal({ children, contentKey }: { children: ReactNode; contentKey: string }) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      key={contentKey}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
