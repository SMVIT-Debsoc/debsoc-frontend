"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Menu, Sparkles, X } from "lucide-react";
import WhyChooseDebsoc from "./WhyChooseDebsoc";
import TeamSection from "./TeamSection";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomeClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const whyChooseRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);

  // Mic split refs (always rendered, toggled by GSAP)
  const micWrapperRef = useRef<HTMLDivElement>(null);
  const micTopRef = useRef<HTMLDivElement>(null);
  const micBotRef = useRef<HTMLDivElement>(null);
  const crackRef = useRef<HTMLDivElement>(null);

  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isWhyChooseOpen, setIsWhyChooseOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);

  // Scrubbable timeline refs — no state needed, avoids re-renders
  const animTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const scrubProgressRef = useRef(0); // 0–1

  const navItems = [
    { title: "Team", sub1: "Current Roster", sub2: "Board Members" },
    { title: "Achievements", sub1: "Trophies", sub2: "Milestones" },
    { title: "Alumni", sub1: "Hall of Fame", sub2: "Past Debaters" },
    { title: "Debate Timer", sub1: "Launch App", sub2: "Settings" },
    { title: "Session", sub1: "Next Meet", sub2: "Resources" },
    { title: "Equity", sub1: "Guidelines", sub2: "Report" },
    { title: "Gallery", sub1: "Photos", sub2: "Videos" },
  ];

  // ─── Build the scrubbable GSAP master timeline ─────────────────────────────
  useGSAP(() => {
    const micWrapper = micWrapperRef.current;
    const micTop = micTopRef.current;
    const micBot = micBotRef.current;
    const crack = crackRef.current;
    const slider = sliderRef.current;
    const rightPanel = document.querySelector<HTMLElement>(".right-content-panel");
    const blurBg = document.querySelector<HTMLElement>(".blur-overlay-bg");
    const heroText = document.querySelector<HTMLElement>(".hero-text-container");

    if (!micWrapper || !micTop || !micBot || !crack || !slider) return;

    const tl = gsap.timeline({ paused: true });
    animTimelineRef.current = tl;

    // ── Phase 0→0.3 : Move mic from its starting position to centre ─────────
    tl.to(micWrapper, {
      left: "50%",
      xPercent: -50,
      duration: 0.3,
      ease: "power2.inOut",
    }, 0);

    // Fade out the right panel and hero text while mic travels
    if (rightPanel) tl.to(rightPanel, { opacity: 0, x: 40, duration: 0.25 }, 0);
    if (heroText)   tl.to(heroText,   { opacity: 0, y: 30, duration: 0.25 }, 0);

    // Bring in the blur backdrop
    if (blurBg) tl.to(blurBg, { opacity: 1, duration: 0.3 }, 0.05);

    // ── Phase 0.3→0.45 : Vibrate / charge-up ───────────────────────────────
    tl.to(micWrapper, {
      x: "+=8",
      duration: 0.04,
      yoyo: true,
      repeat: 7,
      ease: "power1.inOut",
    }, 0.3);

    // ── Phase 0.45 : Switch to the split-mic halves ─────────────────────────
    tl.set(micWrapper, { opacity: 0 }, 0.45);
    tl.set([micTop, micBot], { opacity: 1 }, 0.45);

    // Flash the crack line
    tl.to(crack, { scaleX: 1, opacity: 1, duration: 0.08, ease: "power4.out" }, 0.45);

    // ── Phase 0.5→0.75 : Split vertically ──────────────────────────────────
    tl.to(micTop, { y: "-40vh", rotationZ: -8, scale: 0.75, opacity: 0, duration: 0.35, ease: "power3.in" }, 0.5);
    tl.to(micBot, { y:  "40vh", rotationZ:  5, scale: 0.75, opacity: 0, duration: 0.35, ease: "power3.in" }, 0.5);
    tl.to(crack,  { scaleY: 25, opacity: 0, duration: 0.3, ease: "power2.in" }, 0.55);

    // ── Phase 0.65→1.0 : Real cards fly in from centre ─────────────────────
    // Make slider visible
    tl.set(slider, { autoAlpha: 1 }, 0.65);

    const cards = Array.from(slider.children) as HTMLElement[];
    cards.forEach((card, i) => {
      gsap.set(card, { scale: 0, opacity: 0 });
      tl.to(card, {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: "back.out(1.4)",
      }, 0.65 + i * 0.025);
    });

  }, { scope: containerRef });

  // ─── Wheel handler: scrub timeline or scroll slider ────────────────────────
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // If Why-Choose or Team are open, let them handle it separately
      if (isWhyChooseOpen) {
        if (e.deltaY > 0) setIsTeamOpen(true);
        return;
      }
      if (isTeamOpen) return;

      if (!isExploreOpen) {
        // Scrub the timeline with scroll
        const tl = animTimelineRef.current;
        if (!tl) return;

        scrubProgressRef.current = Math.max(
          0,
          Math.min(1.05, scrubProgressRef.current + e.deltaY * 0.0018)
        );

        gsap.to(tl, {
          progress: Math.min(1, scrubProgressRef.current),
          duration: 0.5,
          ease: "power2.out",
          onComplete: () => {
            if (scrubProgressRef.current >= 1.0) {
              setIsExploreOpen(true);
            }
          },
        });
      } else {
        // Explore is open: map wheel to horizontal scroll
        const slider = sliderRef.current;
        if (!slider) return;

        const atStart = slider.scrollLeft <= 0;
        const atEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 2;

        if (e.deltaY < 0 && atStart) {
          // Scrub back — close explore overlay
          scrubProgressRef.current = Math.max(0, scrubProgressRef.current - 0.15);
          gsap.to(animTimelineRef.current, {
            progress: scrubProgressRef.current,
            duration: 0.5,
            ease: "power2.out",
          });
          setIsExploreOpen(false);
        } else if (e.deltaY > 0 && atEnd) {
          setIsExploreOpen(false);
          setIsWhyChooseOpen(true);
        } else {
          slider.scrollBy({ left: e.deltaY * 0.85 });
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isExploreOpen, isWhyChooseOpen, isTeamOpen]);

  // ─── Existing drop-in + scroll-to-icon GSAP animation ──────────────────────
  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.set(".mic-wrapper", { perspective: 1000 });
    gsap.set(".mic-element", { transformOrigin: "center center" });

    const dropTimeline = gsap.timeline();

    // Drop in from above
    dropTimeline.from(".mic-element", {
      y: -120,
      rotationX: -40,
      opacity: 0,
      duration: 1.4,
      ease: "elastic.out(1, 0.6)",
    });

    // Subtle floating idle loop
    gsap.to(".mic-element", {
      y: "-=12",
      rotationY: "+=3",
      duration: 3.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 1.5,
    });
  }, { scope: containerRef });

  const openExplore = () => {
    const tl = animTimelineRef.current;
    if (!tl) return;
    scrubProgressRef.current = 1;
    gsap.to(tl, { progress: 1, duration: 0.9, ease: "power2.inOut", onComplete: () => setIsExploreOpen(true) });
  };

  return (
    <div className="bg-[#000000] h-screen w-full overflow-hidden relative">
      {/* Container that slides up */}
      <div
        className={`w-full h-full relative transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isTeamOpen ? "-translate-y-[200%]" : isWhyChooseOpen ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* ── Main Hero ─────────────────────────────────────────────────────── */}
        <div
          className="bg-[#000000] text-zinc-100 font-sans h-screen w-full overflow-hidden selection:bg-white/20 selection:text-white"
          ref={containerRef}
        >
          <div ref={stickyRef} className="sticky top-0 w-full h-screen overflow-hidden">

            {/* Navbar */}
            <nav className="absolute top-0 w-full flex justify-between items-center p-8 md:px-12 z-50">
              <div className="flex items-center gap-1 font-light tracking-widest text-xl uppercase relative z-50">
                <Sparkles size={18} strokeWidth={1} className="text-white" />
                DEBSOC
              </div>
              <div className="flex items-center gap-6 z-50 relative">
                <button
                  className="text-white opacity-80 hover:opacity-100 transition-opacity"
                  onClick={openExplore}
                >
                  <Menu size={28} strokeWidth={1} />
                </button>
              </div>
            </nav>

            {/* ── Main Mic (starts at left, GSAP moves to centre) ───────────── */}
            <div
              ref={micWrapperRef}
              className="mic-wrapper absolute inset-y-0 left-[10%] z-10 flex items-end pointer-events-none"
              style={{ width: "auto" }}
            >
              <img
                src="/mic-nobg.png"
                alt="Silver Retro Microphone"
                className="mic-element h-[80vh] md:h-[90vh] w-auto object-contain object-bottom drop-shadow-[0_0_80px_rgba(255,255,255,0.15)]"
                style={{ transformStyle: "preserve-3d" }}
              />
            </div>

            {/* ── Right-side content panel ──────────────────────────────────── */}
            <div className="right-content-panel absolute top-0 right-0 w-full md:w-[50%] h-full flex flex-col justify-center items-end p-8 md:pr-12 md:pl-0 z-0">
              {/* Mission Box & Events Row */}
              <div className="flex flex-col md:flex-row items-start justify-end gap-12 w-full mt-24">
                {/* Mission Text */}
                <div className="mission-card hidden md:block bg-black/30 backdrop-blur-sm border border-white/10 rounded-sm p-6 max-w-[220px]">
                  <p className="text-xs text-zinc-400 uppercase tracking-[0.2em] mb-3 font-light">
                    Mission
                  </p>
                  <p className="text-sm text-zinc-200 font-light leading-relaxed">
                    We curate intellectual battlegrounds. To amplify voices, challenge perspectives, and elevate the debate.
                  </p>
                  <p className="text-sm text-zinc-400 font-light mt-3">We are DEBSOC.</p>
                </div>

                {/* Explore Teaser Cards */}
                <div className="flex flex-col gap-3 items-end">
                  <div className="flex items-center justify-between w-full max-w-[320px] mb-1">
                    <h3 className="text-xs text-zinc-400 uppercase tracking-[0.25em] font-light">Explore</h3>
                    <button
                      onClick={openExplore}
                      className="text-xs text-white/50 hover:text-white uppercase tracking-widest border border-white/10 hover:bg-white/10 px-3 py-1 rounded transition-all"
                    >
                      View All
                    </button>
                  </div>
                  <div className="flex gap-3">
                    {navItems.slice(0, 2).map((item, i) => (
                      <div
                        key={item.title}
                        className="event-card relative w-[145px] h-[100px] group flex-shrink-0 cursor-pointer overflow-hidden rounded-sm border border-white/10 bg-zinc-900"
                        onClick={openExplore}
                      >
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10" />
                        <img
                          src={`/event${(i % 2) + 1}.png`}
                          alt={item.title}
                          className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700"
                        />
                        <div className="absolute bottom-3 left-3 z-20">
                          <h4 className="text-xs text-white font-light uppercase tracking-wider leading-snug">
                            {item.title}:<br />{item.sub1}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Hero text (bottom-left) ───────────────────────────────────── */}
            <div className="hero-text-container absolute bottom-12 md:bottom-20 left-8 md:left-12 z-20 flex flex-col pointer-events-none">
              <h1 className="hero-text text-[3rem] md:text-[5.5rem] lg:text-[7rem] font-light leading-[1.1] tracking-tight text-white mb-2 max-w-4xl drop-shadow-lg">
                DEBSOC:<br />
                <span className="text-zinc-300">THE ART OF ARGUMENT.</span>
              </h1>
              <p className="hero-text text-sm md:text-lg text-zinc-400 font-light max-w-md mt-2 tracking-wide leading-relaxed drop-shadow">
                A high-end production studio for <br />discourse and debate.
              </p>
            </div>

            {/* ── Footer Links ─────────────────────────────────────────────── */}
            <div className="absolute bottom-8 right-8 md:right-12 z-20 flex gap-6 text-xs text-zinc-400 font-light tracking-wider">
              <button
                onClick={() => setIsTeamOpen(true)}
                className="hover:text-white transition-colors underline underline-offset-4 decoration-zinc-600 hover:decoration-white"
              >
                Our Team
              </button>
              <a href="#" className="hover:text-white transition-colors underline underline-offset-4 decoration-zinc-600 hover:decoration-white">
                Upcoming Events
              </a>
              <a href="#" className="hover:text-white transition-colors underline underline-offset-4 decoration-zinc-600 hover:decoration-white">
                Contact
              </a>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                EXPLORE OVERLAY — all controlled by GSAP, always rendered
            ════════════════════════════════════════════════════════════════ */}
            <div
              className={`absolute inset-0 z-[100] flex items-center justify-start ${
                isExploreOpen ? "pointer-events-auto" : "pointer-events-none"
              }`}
            >
              {/* Blur backdrop */}
              <div className="blur-overlay-bg absolute inset-0 bg-black/80 backdrop-blur-3xl opacity-0 pointer-events-none" />

              {/* Split mic halves (initially hidden, shown by GSAP) */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Top half */}
                <div
                  ref={micTopRef}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 will-change-transform"
                  style={{ clipPath: "inset(0 0 50% 0)" }}
                >
                  <img
                    src="/mic-nobg.png"
                    alt=""
                    className="h-[80vh] md:h-[90vh] w-auto object-contain object-bottom drop-shadow-[0_0_60px_rgba(255,255,255,0.2)]"
                  />
                </div>
                {/* Bottom half */}
                <div
                  ref={micBotRef}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 will-change-transform"
                  style={{ clipPath: "inset(50% 0 0 0)" }}
                >
                  <img
                    src="/mic-nobg.png"
                    alt=""
                    className="h-[80vh] md:h-[90vh] w-auto object-contain object-bottom drop-shadow-[0_0_60px_rgba(255,255,255,0.2)]"
                  />
                </div>
                {/* Crack line */}
                <div
                  ref={crackRef}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[3px] bg-white shadow-[0_0_80px_20px_rgba(255,255,255,0.9)] origin-center will-change-transform opacity-0 scale-x-0"
                />
              </div>

              {/* Close button */}
              <button
                className="absolute top-8 right-8 md:right-12 text-white z-[110] p-2 opacity-80 hover:opacity-100 transition-all hover:rotate-90"
                onClick={() => {
                  scrubProgressRef.current = 0;
                  gsap.to(animTimelineRef.current, { progress: 0, duration: 0.6, ease: "power2.inOut" });
                  setIsExploreOpen(false);
                }}
              >
                <X size={36} strokeWidth={1} />
              </button>

              {/* ── Fullscreen card slider ─────────────────────────────────── */}
              <div
                ref={sliderRef}
                className="relative z-[105] flex gap-10 px-[8vw] overflow-x-auto w-full h-[65vh] md:h-[72vh] items-center hide-scrollbar"
                style={{ visibility: "hidden", opacity: 0 }}
              >
                {navItems.flatMap((item, i) => [
                  <div
                    key={`${item.title}-1`}
                    className="relative min-w-[300px] md:min-w-[420px] lg:min-w-[500px] h-full group flex-shrink-0 cursor-pointer overflow-hidden rounded border border-white/10 bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                  >
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all z-10 duration-500" />
                    <img
                      src={`/event${(i % 2) + 1}.png`}
                      alt={item.title}
                      className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-110 group-hover:scale-105 transition-all duration-1000 ease-out"
                    />
                    <div className="absolute bottom-8 left-8 z-20 pr-8 transform group-hover:-translate-y-2 transition-transform duration-500">
                      <h4 className="text-2xl md:text-4xl text-white font-light uppercase tracking-widest leading-snug drop-shadow-lg">
                        {item.title}:<br />
                        <span className="text-zinc-300 text-lg md:text-2xl">{item.sub1}</span>
                      </h4>
                    </div>
                  </div>,
                  <div
                    key={`${item.title}-2`}
                    className="relative min-w-[300px] md:min-w-[420px] lg:min-w-[500px] h-full group flex-shrink-0 cursor-pointer overflow-hidden rounded border border-white/10 bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                  >
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all z-10 duration-500" />
                    <img
                      src={`/event${((i + 1) % 2) + 1}.png`}
                      alt={item.title}
                      className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-110 group-hover:scale-105 transition-all duration-1000 ease-out"
                    />
                    <div className="absolute bottom-8 left-8 z-20 pr-8 transform group-hover:-translate-y-2 transition-transform duration-500">
                      <h4 className="text-2xl md:text-4xl text-white font-light uppercase tracking-widest leading-snug drop-shadow-lg">
                        {item.title}:<br />
                        <span className="text-zinc-300 text-lg md:text-2xl">{item.sub2}</span>
                      </h4>
                    </div>
                  </div>,
                ])}
              </div>
            </div>
            {/* ═══ END EXPLORE OVERLAY ════════════════════════════════════════ */}

          </div>
        </div>
        {/* ── End Main Hero ──────────────────────────────────────────────────── */}

        {/* Why Choose Debsoc Section */}
        <WhyChooseDebsoc isWhyChooseOpen={isWhyChooseOpen} whyChooseRef={whyChooseRef} />

        {/* Team Section */}
        <TeamSection isTeamOpen={isTeamOpen} teamRef={teamRef} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
    </div>
  );
}
