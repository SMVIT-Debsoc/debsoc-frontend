"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";

type HowToUseKind = "chat" | "drill" | "judge";

type HowToUseCardProps = {
  kind: HowToUseKind;
};

type HowToUseContent = {
  title: string;
  description: string;
  steps: string[];
  tip: string;
};

const CONTENT: Record<HowToUseKind, HowToUseContent> = {
  chat: {
    title: "How to use Debate Assistant",
    description: "Ask the DebSoc Assistant questions about debate topics, arguments, research, or preparation.",
    steps: [
      "Enter a clear debate question or describe the argument you want to explore.",
      "Add useful context, constraints, or the side of the debate you are preparing.",
      "Submit your message and wait while the response is prepared.",
      "Review the formatted answer and continue the conversation with a follow-up question.",
    ],
    tip: "Ask one focused question at a time. Include the debate format or motion when relevant, and ask for counterarguments, examples, clarification, or stronger reasoning. Do not include private information or secrets.",
  },
  drill: {
    title: "How to use Mock Drill",
    description: "Use Mock Drill to pressure-test an argument and practise responding to challenges.",
    steps: [
      "Enter the topic, motion, or argument you want to practise.",
      "Add the position or context that the assistant should consider.",
      "Start the drill and wait while the argument is analyzed.",
      "Review the pressure points, counterarguments, and improvement suggestions.",
    ],
    tip: "Use a specific claim instead of a broad topic. Include your reasoning and evidence when available, then try the drill again after improving your argument. Treat the response as practice feedback, not an official debate score.",
  },
  judge: {
    title: "How to use Mock Judge",
    description: "Use Mock Judge to receive structured feedback on an argument using the selected judging context.",
    steps: [
      "Paste or write the argument you want evaluated.",
      "Provide the rubric or judging context when required.",
      "Submit the argument and wait while the response is prepared.",
      "Review the returned criteria, reasoning, strengths, weaknesses, and recommendations.",
    ],
    tip: "Submit a complete argument with a clear claim and reasoning. Include evidence or examples when available, read the explanation behind any returned score, and use the feedback to improve the argument before submitting it again.",
  },
};

const STORAGE_PREFIX = "debsoc:assistant-help-dismissed:";

export default function HowToUseCard({ kind }: HowToUseCardProps) {
  const content = CONTENT[kind];
  const contentId = `how-to-use-${useId().replace(/:/g, "")}`;
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  /* eslint-disable react-hooks/set-state-in-effect -- restore the same-session collapsed preference after hydration. */
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(`${STORAGE_PREFIX}${kind}`) === "true") {
        setExpanded(false);
      }
    } catch {
      // Some privacy modes disable sessionStorage. The guide remains usable.
    }
  }, [kind]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    try {
      if (nextExpanded) window.sessionStorage.removeItem(`${STORAGE_PREFIX}${kind}`);
      else window.sessionStorage.setItem(`${STORAGE_PREFIX}${kind}`, "true");
    } catch {
      // Session persistence is an enhancement, not a requirement for the guide.
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-200/70 bg-indigo-50/60 shadow-sm shadow-indigo-950/[0.03] dark:border-indigo-400/20 dark:bg-indigo-400/[0.07]" aria-labelledby={`${contentId}-title`}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={toggleExpanded}
        className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left text-indigo-950 outline-none transition-colors hover:bg-indigo-100/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/60 dark:text-indigo-100 dark:hover:bg-indigo-400/[0.1]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
          <Info size={15} aria-hidden="true" />
        </span>
        <span id={`${contentId}-title`} className="min-w-0 flex-1 text-xs font-semibold">{content.title}</span>
        <span className="text-[11px] font-medium text-indigo-700/70 dark:text-indigo-200/70">{expanded ? "Collapse" : "Show"}</span>
        <ChevronDown size={15} aria-hidden="true" className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="how-to-use-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div id={contentId} role="region" aria-labelledby={`${contentId}-title`} className="border-t border-indigo-200/60 px-3 pb-3 pt-3 dark:border-indigo-400/15 sm:px-4">
              <p className="max-w-3xl text-xs leading-5 text-indigo-950/75 dark:text-indigo-100/75">{content.description}</p>
              <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                {content.steps.map((step, index) => (
                  <li key={step} className="flex min-w-0 gap-2.5 rounded-xl border border-indigo-200/60 bg-white/45 px-3 py-2.5 text-xs leading-5 text-indigo-950/80 dark:border-indigo-400/15 dark:bg-white/[0.04] dark:text-indigo-100/80">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white dark:bg-indigo-400 dark:text-indigo-950" aria-hidden="true">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 border-l-2 border-indigo-400/70 pl-3 text-xs leading-5 text-indigo-950/75 dark:border-indigo-300/60 dark:text-indigo-100/75"><span className="font-semibold text-indigo-950 dark:text-indigo-100">Tip:</span> {content.tip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
