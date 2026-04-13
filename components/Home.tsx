"use client";

import {useEffect, useRef, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {useGSAP} from "@gsap/react";
import WhyChooseDebsoc from "./WhyChooseDebsoc";
import TeamSection from "./TeamSection";
import AlumniSection from "./AlumniSection";
import AchievementSection from "./AchievementSection";
import Footer from "./Footer";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

type NavItem = {
    title: string;
    sub1: string;
    sub2: string;
    href?: string;
    sectionTarget?: string;
};

export default function HomeClient() {
    const MIC_INTRO_DURATION = 1.9;

    const containerRef = useRef<HTMLDivElement>(null);
    const micWrapperRef = useRef<HTMLDivElement>(null);
    const micTopRef = useRef<HTMLDivElement>(null);
    const micBotRef = useRef<HTMLDivElement>(null);
    const crackRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const exploreWrapperRef = useRef<HTMLDivElement>(null);

    const router = useRouter();

    useEffect(() => {
        const root = document.documentElement;
        let rafId: number | null = null;

        const syncViewportAndTriggers = () => {
            const viewportHeight =
                window.visualViewport?.height ?? window.innerHeight;
            root.style.setProperty("--hero-vh", `${viewportHeight * 0.01}px`);
            ScrollTrigger.refresh();
        };

        const scheduleSync = () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(syncViewportAndTriggers);
        };

        scheduleSync();

        window.addEventListener("resize", scheduleSync);
        window.addEventListener("orientationchange", scheduleSync);
        window.visualViewport?.addEventListener("resize", scheduleSync);

        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            window.removeEventListener("resize", scheduleSync);
            window.removeEventListener("orientationchange", scheduleSync);
            window.visualViewport?.removeEventListener("resize", scheduleSync);
        };
    }, []);

    const navItems: NavItem[] = [
        {
            title: "Team",
            sub1: "Current Roster",
            sub2: "Board Members",
            sectionTarget: "team",
        },
        {
            title: "Achievements",
            sub1: "Trophies",
            sub2: "Milestones",
            sectionTarget: "achievements",
        },
        {
            title: "Alumni",
            sub1: "Hall of Fame",
            sub2: "Past Debaters",
            sectionTarget: "alumni",
        },
        {
            title: "Debate Timer",
            sub1: "Launch App",
            sub2: "Settings",
            href: "/debate-timer",
        },
        {
            title: "Session",
            sub1: "Next Meet",
            sub2: "Resources",
            href: "/session",
        },
        {title: "Equity", sub1: "Guidelines", sub2: "Report", href: "/equity"},
    ];

    const navigateFromCard = (item: NavItem) => {
        if (item.sectionTarget) {
            const el = document.getElementById(item.sectionTarget);
            if (el) {
                el.scrollIntoView({behavior: "smooth"});
            }
            return;
        }

        if (item.href) {
            router.push(item.href);
        }
    };

    // ══════════════════════════════════════════════════════════════════════
    //  Scrubbable GSAP timeline
    // ══════════════════════════════════════════════════════════════════════
    useGSAP(
        () => {
            const micWrapper = micWrapperRef.current;
            const micTop = micTopRef.current;
            const micBot = micBotRef.current;
            const crack = crackRef.current;
            const slider = sliderRef.current;
            const rightPanel = document.querySelector<HTMLElement>(
                ".right-content-panel",
            );
            const heroText = document.querySelector<HTMLElement>(
                ".hero-text-container",
            );
            const blurBg =
                document.querySelector<HTMLElement>(".blur-overlay-bg");

            if (!micWrapper || !micTop || !micBot || !crack || !slider) return;

            // Make sure split halves start hidden & slider invisible
            gsap.set([micTop, micBot], {opacity: 0});
            gsap.set(crack, {scaleX: 0, opacity: 0});
            gsap.set(slider, {autoAlpha: 0});
            
            // Lock xPercent to -50 in GSAP so translation animations don't blow away the alignment
            gsap.set([micWrapper, micTop, micBot], {xPercent: -50});

            const cards = Array.from(slider.children) as HTMLElement[];
            cards.forEach((c) => gsap.set(c, {scale: 0, opacity: 0}));

            let mm = gsap.matchMedia();

            mm.add(
                {
                    isDesktop: "(min-width: 768px)",
                    isMobile: "(max-width: 767px)",
                },
                (context) => {
                    const {isDesktop} = context.conditions as any;

                    const getAdditionalScroll = () => {
                        if (!isDesktop || !slider) return 0;
                        return Math.max(
                            0,
                            slider.scrollWidth - window.innerWidth + 100,
                        );
                    };

                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: containerRef.current,
                            start: "top top",
                            end: () => {
                                const extra = getAdditionalScroll();
                                if (!isDesktop) return "+=150%";
                                return `+=${150 + (extra / Math.max(window.innerHeight, 1)) * 100}%`;
                            },
                            scrub: 1, // Smooth scrub
                            pin: true, // Pin the hero section while animating
                            invalidateOnRefresh: true,
                        },
                    });

                    // ─── Phase 1 (0 → 0.35) : Mic is already centred; ensure position is exact ─────────────
                    tl.to(
                        micWrapper,
                        {
                            left: "50%",
                            duration: 0.35,
                            ease: "power2.inOut",
                        },
                        0,
                    );

                    // Fade out right panel & hero text as mic moves
                    if (rightPanel)
                        tl.to(
                            rightPanel,
                            {opacity: 0, x: 30, duration: 0.3},
                            0,
                        );
                    if (heroText)
                        tl.to(heroText, {opacity: 0, y: 20, duration: 0.3}, 0);
                    if (blurBg)
                        tl.to(blurBg, {opacity: 1, duration: 0.35}, 0.05);

                    // ─── Phase 2 (0.35 → 0.52) : Mic vibrates / charges up ────────────────
                    tl.to(
                        micWrapper,
                        {
                            x: "+=10",
                            duration: 0.05,
                            yoyo: true,
                            repeat: 9, // 10 bounces ≈ 0.5s total charge-up
                            ease: "power1.inOut",
                        },
                        0.35,
                    );

                    // ─── Phase 3 (0.55) : Seamless swap — show halves, hide wrapper ────────
                    tl.set(micTop, {opacity: 1}, 0.55);
                    tl.set(micBot, {opacity: 1}, 0.55);
                    tl.set(micWrapper, {opacity: 0}, 0.55);

                    // Flash crack line at the 50% height of mic
                    tl.to(
                        crack,
                        {
                            scaleX: 1,
                            opacity: 1,
                            duration: 0.12,
                            ease: "power4.out",
                        },
                        0.55,
                    );

                    // ─── Phase 4 (0.63 → 1.3) : Slow cinematic split ──────────────────────
                    tl.to(
                        micTop,
                        {
                            y: "-38vh",
                            rotationZ: -6,
                            scale: 0.8,
                            opacity: 0,
                            duration: 0.85, // slow & cinematic
                            ease: "power2.inOut",
                        },
                        0.63,
                    );

                    tl.to(
                        micBot,
                        {
                            y: "38vh",
                            rotationZ: 4,
                            scale: 0.8,
                            opacity: 0,
                            duration: 0.85,
                            ease: "power2.inOut",
                        },
                        0.63,
                    );

                    tl.to(
                        crack,
                        {
                            scaleY: 30,
                            opacity: 0,
                            duration: 0.7,
                            ease: "power2.in",
                        },
                        0.68,
                    );

                    // ─── Phase 5 (0.85 → 1.4) : Real cards scale in from centre ───────────
                    tl.set(slider, {autoAlpha: 1}, 0.85);
                    tl.set(
                        exploreWrapperRef.current,
                        {pointerEvents: "auto"},
                        0.85,
                    );

                    cards.forEach((card, i) => {
                        tl.to(
                            card,
                            {
                                scale: 1,
                                opacity: 1,
                                duration: 0.4,
                                ease: "back.out(1.3)",
                            },
                            0.87 + i * 0.03,
                        );
                    });

                    // ─── Phase 6 (1.4 → 2.9) : Horizontal scrub (Desktop Only) ────────────
                    if (isDesktop) {
                        const scrollTarget = {val: 0};
                        tl.to(
                            scrollTarget,
                            {
                                val: () => getAdditionalScroll(),
                                duration: 1.5,
                                ease: "none",
                                onUpdate: () => {
                                    if (slider)
                                        slider.scrollLeft = scrollTarget.val;
                                },
                            },
                            1.4,
                        );
                    }
                },
            );

            return () => mm.revert();
        },
        {scope: containerRef},
    );

    // ══════════════════════════════════════════════════════════════════════
    //  On-mount: mic drop-in animation removed as per request (animation only on scroll)
    // ══════════════════════════════════════════════════════════════════════

    const openExplore = () => {
        const container = containerRef.current;
        const trigger = ScrollTrigger.getAll().find(
            (st) => st.vars.trigger === container,
        );

        if (trigger) {
            const start = Number(trigger.start) || 0;
            const end = Number(trigger.end) || start;
            const target = start + (end - start) * 0.9;
            window.scrollTo({top: target, behavior: "smooth"});
            return;
        }

        const fallbackHeight =
            container?.getBoundingClientRect().height ?? window.innerHeight;
        window.scrollTo({
            top: window.scrollY + fallbackHeight * 1.2,
            behavior: "smooth",
        });
    };

    return (
        <div className="bg-[#000000] w-full relative overflow-x-hidden">
            {/* ══════════════ MAIN HERO ══════════════ */}
            <div
                className="bg-[#000000] text-zinc-100 font-sans min-h-[calc(var(--hero-vh,1vh)*100)] h-[calc(var(--hero-vh,1vh)*100)] w-full overflow-hidden selection:bg-white/20 selection:text-white"
                ref={containerRef}
            >
                <div className="w-full h-[calc(var(--hero-vh,1vh)*100)] overflow-hidden">
                    {/* ── Main mic (GSAP moves this to centre) ───────────────── */}
                    {/*
              FIX: positioned at bottom-0, left-[10%] to start.
              GSAP animates left → 50% and xPercent → -50 so it centres perfectly.
              Split halves mirror this exact layout (bottom-0, left-1/2 -translate-x-1/2).
            */}
                    <div
                        ref={micWrapperRef}
                        className="mic-wrapper absolute bottom-[clamp(13vh,15svh,18vh)] md:bottom-0 z-30 pointer-events-none left-1/2"
                    >
                        <img
                            src="/mic-nobg.png"
                            alt="Retro Microphone"
                            className="mic-element h-[clamp(70vh,76svh,84vh)] min-h-[440px] max-h-[96vh] sm:h-[54vh] md:h-[90vh] lg:h-[90vh] xl:h-[90vh] w-auto max-w-[min(98vw,39rem)] sm:max-w-[min(78vw,42rem)] md:max-w-none object-contain object-bottom origin-center scale-[1.65] md:scale-100 [clip-path:inset(0_0_23%_0)] md:[clip-path:inset(0_0_0_0)] brightness-[1.25] contrast-[1.12] saturate-[1.06] md:brightness-100 md:contrast-100 md:saturate-100"
                            style={{
                                transformStyle: "preserve-3d",
                                display: "block",
                            }}
                        />
                    </div>

                    {/* ── Right content panel ─────────────────────────────────── */}
                    <div className="right-content-panel absolute inset-y-0 right-0 hidden md:flex md:w-[50%] h-full flex-col justify-center items-end p-8 md:pr-12 z-0">
                        <div className="flex flex-col md:flex-row items-start justify-end gap-12 w-full mt-24">
                            {/* Mission card */}
                            <div className="hidden md:block bg-black/30 backdrop-blur-sm border border-white/10 rounded-sm p-6 max-w-55">
                                <p className="text-xs text-zinc-400 uppercase tracking-[0.2em] mb-3 font-light">
                                    Mission
                                </p>
                                <p className="text-sm text-zinc-200 font-light leading-relaxed">
                                    We curate intellectual battlegrounds. To
                                    amplify voices, challenge perspectives, and
                                    elevate the debate.
                                </p>
                                <p className="text-sm text-zinc-400 font-light mt-3">
                                    We are DEBSOC.
                                </p>
                            </div>

                            {/* Explore teaser */}
                            <div className="flex flex-col gap-3 items-end">
                                <div className="flex items-center justify-between w-full max-w-[320px] mb-1">
                                    <h3 className="text-xs text-zinc-400 uppercase tracking-[0.25em] font-light">
                                        Explore
                                    </h3>
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
                                            className="relative w-32 md:w-36.25 h-24 md:h-25 group shrink-0 cursor-pointer overflow-hidden rounded-sm border border-white/10 bg-zinc-900"
                                            onClick={() =>
                                                navigateFromCard(item)
                                            }
                                        >
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10" />
                                            <img
                                                src={`/event${(i % 2) + 1}.png`}
                                                alt={item.title}
                                                className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700"
                                            />
                                            <div className="absolute bottom-3 left-3 z-20">
                                                <h4 className="text-xs text-white font-light uppercase tracking-wider leading-snug">
                                                    {item.title}:
                                                    <br />
                                                    {item.sub1}
                                                </h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Hero text ───────────────────────────────────────────── */}
                    {/* Mobile gradient behind text for readability over the centered mic */}
                    <div className="md:hidden absolute inset-x-0 bottom-0 h-[58svh] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-[35]" />
                    <div className="hero-text-container absolute inset-x-0 top-[clamp(84px,12svh,118px)] md:left-12 md:right-auto md:top-auto md:bottom-20 z-[40] flex flex-col items-center text-center md:items-start md:text-left pointer-events-none w-full md:w-auto px-6 md:px-0 md:max-w-4xl">
                        <h1 className="hero-text text-[clamp(2.8rem,11.8vw,5rem)] md:text-[5.5rem] lg:text-[7rem] font-light leading-[0.96] tracking-[-0.02em] text-zinc-200 mb-2 drop-shadow-[0_6px_22px_rgba(0,0,0,0.55)]">
                            DEBSOC:
                            <span className="block md:hidden text-zinc-400">
                                THE ART OF
                            </span>
                            <span className="block md:hidden text-zinc-400">
                                ARGUMENT
                            </span>
                            <span className="hidden md:inline text-zinc-300">
                                <br />
                                THE ART OF ARGUMENT.
                            </span>
                        </h1>
                        <p className="hero-text hidden md:block text-[clamp(0.95rem,1.65vw,1.125rem)] md:text-lg text-zinc-400 font-light max-w-[20rem] sm:max-w-md mt-2 tracking-wide md:tracking-wide leading-relaxed drop-shadow md:normal-case uppercase md:uppercase">
                            A high-end production studio for <br />
                            discourse and debate.
                        </p>
                    </div>

                    <div className="md:hidden absolute inset-x-0 bottom-[max(8svh,64px)] z-[40] flex flex-col items-center text-center px-8 pointer-events-none">
                        <p className="hero-text text-[0.78rem] text-zinc-400 font-light max-w-[20rem] tracking-[0.035em] leading-[1.62] uppercase">
                            A high-end production studio
                            <br />
                            for discourse and debate.
                        </p>
                        <button
                            onClick={openExplore}
                            className="mt-8 px-12 py-3.5 text-[11px] font-medium text-white/95 uppercase tracking-[0.2em] border border-white/60 rounded-xl bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_0_18px_rgba(255,255,255,0.14),0_0_36px_rgba(255,255,255,0.14)] backdrop-blur-md transition-all pointer-events-auto"
                        >
                            Explore
                        </button>
                    </div>

                    {/* ── Footer links ────────────────────────────────────────── */}
                    <div className="absolute bottom-6 md:bottom-8 right-4 md:right-12 z-20 hidden sm:flex gap-4 md:gap-6 text-xs text-zinc-400 font-light tracking-wider md:gap-6">
                        <button
                            onClick={() => {
                                const el = document.getElementById("team");
                                if (el) el.scrollIntoView({behavior: "smooth"});
                            }}
                            className="hover:text-white transition-colors underline underline-offset-4 decoration-zinc-600 hover:decoration-white"
                        >
                            Our Team
                        </button>
                        <a
                            href="#"
                            className="hover:text-white transition-colors underline underline-offset-4 decoration-zinc-600 hover:decoration-white"
                        >
                            Upcoming Events
                        </a>
                        <a
                            href="#"
                            className="hover:text-white transition-colors underline underline-offset-4 decoration-zinc-600 hover:decoration-white hidden md:inline"
                        >
                            Contact
                        </a>
                    </div>

                    {/* ══════════════════ EXPLORE OVERLAY ══════════════════════ */}
                    {/*
              Always rendered — GSAP manages visibility,
              React only controls pointer-events.
            */}
                    <div
                        ref={exploreWrapperRef}
                        className="absolute inset-0 z-100 flex items-center justify-start pointer-events-none"
                    >
                        {/* Blur backdrop */}
                        <div className="blur-overlay-bg absolute inset-0 bg-black/80 backdrop-blur-3xl opacity-0 pointer-events-none" />

                        {/*
                FIX: Split halves are positioned bottom-0, left-1/2 -translate-x-1/2
                This EXACTLY mirrors the mic-wrapper after GSAP centres it.
                No positional jump when swapping between wrapper and halves.
              */}
                        <div className="absolute inset-0 z-1 pointer-events-none">
                            {/* Top half (clips bottom 50% of image) */}
                            <div
                                ref={micTopRef}
                                className="absolute bottom-[6vh] md:bottom-0 flex justify-center left-1/2 will-change-transform h-[63vh] min-h-[400px] max-h-[92vh] md:h-[90vh] lg:h-[90vh] xl:h-[90vh] w-full opacity-0"
                                style={{clipPath: "inset(0 0 50% 0)"}}
                            >
                                <img
                                    src="/mic-nobg.png"
                                    alt=""
                                    className="h-full w-auto max-w-[min(102vw,32rem)] md:max-w-none object-contain object-bottom brightness-[1.25] contrast-[1.12] saturate-[1.06] md:brightness-100 md:contrast-100 md:saturate-100"
                                    style={{display: "block"}}
                                />
                            </div>

                            {/* Bottom half (clips top 50% of image) */}
                            <div
                                ref={micBotRef}
                                className="absolute bottom-[6vh] md:bottom-0 flex justify-center left-1/2 will-change-transform h-[63vh] min-h-[400px] max-h-[92vh] md:h-[90vh] lg:h-[90vh] xl:h-[90vh] w-full opacity-0"
                                style={{clipPath: "inset(50% 0 0 0)"}}
                            >
                                <img
                                    src="/mic-nobg.png"
                                    alt=""
                                    className="h-full w-auto max-w-[min(102vw,32rem)] md:max-w-none object-contain object-bottom brightness-[1.25] contrast-[1.12] saturate-[1.06] md:brightness-100 md:contrast-100 md:saturate-100"
                                    style={{display: "block"}}
                                />
                            </div>

                            {/* Crack / light flash — dynamically centered vertically on the mic */}
                            <div
                                ref={crackRef}
                                className="absolute bottom-[calc(6vh+31.5vh)] md:bottom-[40vh] lg:bottom-[40vh] xl:bottom-[40vh] w-full h-0.75 bg-white shadow-[0_0_100px_24px_rgba(255,255,255,0.95)] origin-center will-change-transform left-0 opacity-0"
                            />
                        </div>

                        {/* Fullscreen card slider */}
                        <div
                            ref={sliderRef}
                            className="relative z-105 w-full h-[clamp(460px,74svh,720px)] md:h-[72vh] hide-scrollbar opacity-0 invisible px-3 sm:px-6 md:px-[8vw] py-2 sm:py-4 md:py-0 grid grid-cols-2 gap-2 sm:gap-4 overflow-y-auto overflow-x-hidden content-start md:flex md:items-center md:gap-10 md:overflow-x-auto md:overflow-y-hidden"
                        >
                            {navItems.map((item, i) => (
                                <div
                                    key={item.title}
                                    onClick={() => navigateFromCard(item)}
                                    className="relative w-full md:w-auto min-w-0 h-[calc((clamp(460px,74svh,720px)-2rem)/3)] min-h-[130px] sm:h-[30vh] md:min-w-75 lg:min-w-105 xl:min-w-125 md:h-full group shrink-0 cursor-pointer overflow-hidden rounded border border-white/10 bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                                >
                                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all z-10 duration-500" />
                                    <img
                                        src={`/event${(i % 2) + 1}.png`}
                                        alt={item.title}
                                        className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-110 group-hover:scale-105 transition-all duration-1000 ease-out"
                                    />
                                    <div className="absolute bottom-3 sm:bottom-4 md:bottom-8 left-3 sm:left-4 md:left-8 z-20 pr-3 sm:pr-4 md:pr-8 transform group-hover:-translate-y-2 transition-transform duration-500">
                                        <h4 className="text-sm sm:text-base md:text-4xl text-white font-light uppercase tracking-wider md:tracking-widest leading-snug drop-shadow-lg">
                                            {item.title}:<br />
                                            <span className="text-zinc-300 text-xs sm:text-sm md:text-2xl">
                                                {item.sub1}
                                            </span>
                                            <br />
                                            <span className="text-zinc-400 text-[11px] sm:text-xs md:text-lg">
                                                {item.sub2}
                                            </span>
                                        </h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* ══════════════ END EXPLORE OVERLAY ══════════════════════ */}
                </div>
            </div>
            {/* ══════════════ END MAIN HERO ══════════════ */}

            <WhyChooseDebsoc />
            <TeamSection />
            <AchievementSection />
            <AlumniSection />
            <Footer />

            <style
                dangerouslySetInnerHTML={{
                    __html: `.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`,
                }}
            />
        </div>
    );
}
