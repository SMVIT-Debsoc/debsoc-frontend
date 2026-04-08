"use client";

import React, { useState, useEffect, useRef } from "react";
import { Globe, Users, Trophy, Mic } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ElegantShape } from "./ui/shape-landing-hero";
import { motion } from "framer-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface WhyChooseDebsocProps {
  isWhyChooseOpen: boolean;
  whyChooseRef: React.RefObject<HTMLDivElement | null>;
}

const timelineData = [
  {
    title: "WEEKLY SESSIONS",
    icon: Globe,
    desc: "Participate in weekly practice sessions with fellow members. Sharpen your skills across diverse topics and genres for consistent growth.",
  },
  {
    title: "MENTORSHIP PROGRAM",
    icon: Users,
    desc: "Advance through structured mentorship within the community and access workshops led by world renowned debaters and distinguished alumni.",
  },
  {
    title: "TOURNAMENT EXPOSURE",
    icon: Trophy,
    desc: "Compete in premier Intervarsity tournaments at local, national, and international levels. Build experience across both online and offline circuits.",
  },
  {
    title: "PRACTICE & ORATORY TRAINING",
    icon: Mic,
    desc: "Elevate your preparation through cross-college practice sessions. Master public speaking and refine your persuasive abilities through targeted training.",
  },
];

export default function WhyChooseDebsoc({
  isWhyChooseOpen,
  whyChooseRef,
}: WhyChooseDebsocProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Set up GSAP scroll animations when section becomes visible
  useEffect(() => {
    if (!isWhyChooseOpen) {
      // Kill all existing scroll triggers when closed
      ScrollTrigger.getAll().forEach(t => t.kill());
      return;
    }

    const scroller = whyChooseRef.current;
    if (!scroller || !timelineRef.current || !lineRef.current) return;

    // Small delay to ensure the DOM has settled after transition animation
    const setupTimeout = setTimeout(() => {
      ScrollTrigger.refresh();

      // 1. Animate the timeline line drawing down
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          transformOrigin: "top center",
          scrollTrigger: {
            trigger: timelineRef.current,
            scroller: scroller,
            start: "top 60%",
            end: "bottom 60%",
            scrub: 1,
          },
        }
      );

      // 2. Animate each row card — initially hidden via gsap.set
      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        
        const card = row.querySelector<HTMLElement>(".timeline-card-anim");
        const dot = row.querySelector<HTMLElement>(".timeline-dot");
        
        if (!card || !dot) return;

        const isLeft = i % 2 === 0;

        // Set initial hidden state
        gsap.set(card, { opacity: 0, y: 40, x: isLeft ? -40 : 40 });
        gsap.set(dot, { opacity: 0, scale: 0 });

        // Create scroll trigger for this row
        ScrollTrigger.create({
          trigger: row,
          scroller: scroller,
          start: "top 65%",  // When top of card hits 65% down the viewport
          end: "bottom 20%",
          onEnter: () => {
            gsap.to(dot, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" });
            gsap.to(card, { opacity: 1, y: 0, x: 0, duration: 0.7, ease: "power3.out", delay: 0.15 });
          },
          onLeaveBack: () => {
            // Hide again when scrolling back up past this row
            gsap.to(dot, { opacity: 0, scale: 0, duration: 0.2 });
            gsap.to(card, { opacity: 0, y: 40, x: isLeft ? -40 : 40, duration: 0.3 });
          },
        });
      });
    }, 800); // Wait for the slide-in transition to complete

    return () => {
      clearTimeout(setupTimeout);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [isWhyChooseOpen, whyChooseRef]);

  return (
    <div
      ref={whyChooseRef}
      className="absolute top-full left-0 w-full h-screen overflow-y-auto overflow-x-hidden bg-[#030303] z-50 text-white hide-scrollbar"
    >
      {/* ── Sticky Geometric Background (scoped to this container only) ── */}
      <div
        className="sticky top-0 w-full h-screen pointer-events-none overflow-hidden -mb-[100vh] z-0"
      >
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

      {/* ── Scrollable Content ── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 pt-28 pb-48">
        
        {/* Hero Title */}
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter leading-none">
            <TypewriterText text="WHY CHOOSE" active={isWhyChooseOpen} />
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 via-white to-zinc-500 block mt-3">
              DEBSOC
            </span>
          </h2>
          <p className="text-zinc-400 text-sm md:text-base text-center max-w-2xl font-light mx-auto leading-relaxed mt-8">
            Experience the difference with our supportive community, flexible
            policies, and world‑class mentorship.
          </p>
        </div>

        {/* ── Timeline ── */}
        <div ref={timelineRef} className="relative w-full pb-16">
          {/* Track — static background */}
          <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-[2px] bg-white/5 md:-translate-x-px rounded-full" />
          {/* Animated fill line */}
          <div
            ref={lineRef}
            className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-[2px] bg-white md:-translate-x-px rounded-full origin-top shadow-[0_0_12px_rgba(255,255,255,0.6)]"
            style={{ transform: "scaleY(0)", transformOrigin: "top" }}
          />

          {/* Rows */}
          <div className="flex flex-col gap-20 md:gap-28 pt-8">
            {timelineData.map((item, i) => {
              const isEven = i % 2 === 0;
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  ref={el => { rowRefs.current[i] = el; }}
                  className="timeline-row relative flex flex-col md:flex-row items-start md:items-center justify-between w-full"
                >
                  {/* ── Center dot ── */}
                  <div className="timeline-dot absolute left-[20px] md:left-1/2 top-10 md:top-1/2 -translate-y-1/2 md:-translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#030303] border-[2.5px] border-white z-20 shadow-[0_0_16px_rgba(255,255,255,0.6)]" />

                  {/* ── Left half ── */}
                  <div className={`w-full md:w-1/2 pl-14 md:pl-0 md:pr-12 flex ${isEven ? "md:justify-end" : "md:justify-start"}`}>
                    {isEven ? (
                      /* Card left */
                      <div className="timeline-card-anim w-full max-w-md bg-zinc-900/50 backdrop-blur-2xl border border-white/10 p-8 rounded-2xl group hover:bg-zinc-800/50 hover:border-white/20 transition-all duration-500 shadow-xl">
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/15 flex items-center justify-center mb-6 text-white group-hover:bg-white group-hover:text-black transition-all duration-500">
                          <Icon size={22} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base md:text-lg font-semibold tracking-widest mb-3 text-white uppercase">{item.title}</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed font-light">{item.desc}</p>
                      </div>
                    ) : (
                      /* Quote right of line — only desktop */
                      <p className="timeline-card-anim hidden md:block text-zinc-500 font-light text-right max-w-sm text-base md:text-lg leading-relaxed italic">
                        &ldquo;{item.desc.split(".")[0]}.&rdquo;
                      </p>
                    )}
                  </div>

                  {/* ── Right half ── */}
                  <div className="w-full md:w-1/2 pl-14 md:pl-12 flex md:justify-start mt-8 md:mt-0">
                    {!isEven ? (
                      /* Card right */
                      <div className="timeline-card-anim w-full max-w-md bg-zinc-900/50 backdrop-blur-2xl border border-white/10 p-8 rounded-2xl group hover:bg-zinc-800/50 hover:border-white/20 transition-all duration-500 shadow-xl">
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/15 flex items-center justify-center mb-6 text-white group-hover:bg-white group-hover:text-black transition-all duration-500">
                          <Icon size={22} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base md:text-lg font-semibold tracking-widest mb-3 text-white uppercase">{item.title}</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed font-light">{item.desc}</p>
                      </div>
                    ) : (
                      /* Quote left of line — only desktop */
                      <p className="timeline-card-anim hidden md:block text-zinc-500 font-light text-left max-w-sm text-base md:text-lg leading-relaxed italic border-l border-white/10 pl-6">
                        &ldquo;{item.desc.split(".")[0]}.&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Typewriter ── */
function TypewriterText({ text, active }: { text: string; active: boolean }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    // Small delay so it starts after the slide-in animation
    const startDelay = setTimeout(() => {
      const timer = setInterval(() => {
        setDisplayed(text.substring(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(timer);
      }, 80);
      return () => clearInterval(timer);
    }, 700);
    return () => clearTimeout(startDelay);
  }, [text, active]);

  return (
    <span className="inline-block relative">
      {displayed}
      <span className="animate-pulse font-thin ml-1">_</span>
    </span>
  );
}
