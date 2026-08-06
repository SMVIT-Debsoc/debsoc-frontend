"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { PrimaryButton } from "./ui";

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
      data-layout={stacked ? "stacked" : "flow"}
      className="grid min-w-0 grid-cols-1 gap-5"
      transition={{ layout: { duration, ease: easeOut } }}
    >
      <motion.div layout className="min-w-0" transition={{ layout: { duration, ease: easeOut } }}>
        {preparation}
      </motion.div>
      <AnimatePresence initial={false}>
        {analysisActive && (
          <motion.div
            key="analysis-result-region"
            layout
            ref={resultRegionRef}
            tabIndex={-1}
            aria-label="Analysis result"
            className="min-w-0 scroll-mt-6 outline-none"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.3, ease: easeOut }}
          >
            {result}
          </motion.div>
        )}
      </AnimatePresence>
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

export function AnalysisResetButton({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="relative">
      <PrimaryButton type="button" variant="danger" onClick={() => setConfirming(true)} className="min-h-10 px-3 text-xs">
        <Trash2 size={14} aria-hidden="true" />
        Reset
      </PrimaryButton>
      {confirming && <div role="dialog" aria-label="Confirm analysis reset" className="absolute bottom-[calc(100%+0.5rem)] left-0 z-20 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl"><p className="text-xs leading-5">Discard this input and the current output?</p><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setConfirming(false)} className="min-h-10 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Keep</button><PrimaryButton type="button" variant="danger" onClick={onReset} className="min-h-10 px-3 text-xs">Reset now</PrimaryButton></div></div>}
    </div>
  );
}
