"use client";

import {useEffect, useRef, useState} from "react";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {useGSAP} from "@gsap/react";
import {useRouter, useSearchParams} from "next/navigation";
import {Menu, Sparkles} from "lucide-react";
import WhyChooseDebsoc from "./WhyChooseDebsoc";
import TeamSection from "./TeamSection";
import AlumniSection from "./AlumniSection";
import AchievementSection from "./AchievementSection";
import GallerySection from "./GallerySection";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

// ── Section enum so we never have stale-closure issues ─────────────────────────
type Section =
    | "home"
    | "explore"
    | "whychoose"
    | "achievements"
    | "team"
    | "alumni"
    | "gallery";

type NavItem = {
    title: string;
    sub1: string;
    sub2: string;
    href?: string;
    sectionTarget?: Section;
};

export default function HomeClient() {
    const SECTION_BOUNDARY_EPSILON = 4;
    const HOME_SCRUB_SENSITIVITY = 0.0012;
    const HOME_SCRUB_TWEEN_DURATION = 0.75;
    const MIC_INTRO_DURATION = 1.9;
    const OPEN_EXPLORE_DURATION = 1.35;
    const CLOSE_EXPLORE_DURATION = 0.85;

    const containerRef = useRef<HTMLDivElement>(null);
    const stickyRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const whyChooseRef = useRef<HTMLDivElement>(null);
    const achievementsRef = useRef<HTMLDivElement>(null);
    const teamRef = useRef<HTMLDivElement>(null);
    const alumniRef = useRef<HTMLDivElement>(null);
    const galleryRef = useRef<HTMLDivElement>(null);

    const router = useRouter();
    const searchParams = useSearchParams();

    // mic refs
    const micWrapperRef = useRef<HTMLDivElement>(null);
    const micTopRef = useRef<HTMLDivElement>(null);
    const micBotRef = useRef<HTMLDivElement>(null);
    const crackRef = useRef<HTMLDivElement>(null);

    // React state (drives CSS class on the sliding container)
    const [section, setSection] = useState<Section>("home");

    const validSections: Section[] = [
        "home",
        "explore",
        "whychoose",
        "achievements",
        "team",
        "alumni",
        "gallery",
    ];

    // ── Use a REF mirror of section to avoid stale closures in wheel handler ──
    const sectionRef = useRef<Section>("home");
    const setSectionSynced = (s: Section) => {
        sectionRef.current = s;
        setSection(s);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            const currentSectionParam = url.searchParams.get("section");
            const nextSectionParam = s === "home" || s === "explore" ? null : s;

            if (nextSectionParam) {
                url.searchParams.set("section", nextSectionParam);
            } else {
                url.searchParams.delete("section");
            }

            if (currentSectionParam !== nextSectionParam) {
                window.history.replaceState(
                    null,
                    "",
                    `${url.pathname}${url.search}`,
                );
            }

            (window as Window & {__debsocSection?: Section}).__debsocSection =
                s;
            window.dispatchEvent(
                new CustomEvent("debsoc:section-change", {
                    detail: {section: s},
                }),
            );
        }
    };

    // Scrubbable timeline state
    const animTimelineRef = useRef<gsap.core.Timeline | null>(null);
    const scrubProgressRef = useRef(0); // 0 → 1

    // Transition lock — prevents cascading section jumps from one scroll gesture
    const transitionLockRef = useRef(false);
    const lockTransition = (ms = 1300) => {
        transitionLockRef.current = true;
        setTimeout(() => {
            transitionLockRef.current = false;
        }, ms);
    };

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
        {
            title: "Gallery",
            sub1: "Photos",
            sub2: "Videos",
            sectionTarget: "gallery",
        },
    ];

    const navigateFromCard = (item: NavItem) => {
        if (item.sectionTarget) {
            const target = item.sectionTarget;
            if (target === "home") {
                scrubProgressRef.current = 0;
                if (animTimelineRef.current) {
                    gsap.to(animTimelineRef.current, {
                        progress: 0,
                        duration: CLOSE_EXPLORE_DURATION,
                        ease: "power2.inOut",
                    });
                }
                setSectionSynced("home");
                return;
            }

            scrubProgressRef.current = 1;
            if (animTimelineRef.current) {
                gsap.to(animTimelineRef.current, {
                    progress: 1,
                    duration: 0.45,
                    ease: "power2.out",
                });
            }
            setSectionSynced(target);
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

            const cards = Array.from(slider.children) as HTMLElement[];
            cards.forEach((c) => gsap.set(c, {scale: 0, opacity: 0}));

            const tl = gsap.timeline({paused: true});
            animTimelineRef.current = tl;

            // ─── Phase 1 (0 → 0.35) : Mic travels from left to centre ─────────────
            tl.to(
                micWrapper,
                {
                    left: "50%",
                    xPercent: -50,
                    duration: 0.35,
                    ease: "power2.inOut",
                },
                0,
            );

            // Fade out right panel & hero text as mic moves
            if (rightPanel)
                tl.to(rightPanel, {opacity: 0, x: 30, duration: 0.3}, 0);
            if (heroText)
                tl.to(heroText, {opacity: 0, y: 20, duration: 0.3}, 0);
            if (blurBg) tl.to(blurBg, {opacity: 1, duration: 0.35}, 0.05);

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
            // Set split halves visible FIRST (same GSAP frame), THEN hide wrapper
            // This prevents the 1-frame flash of black.
            tl.set(micTop, {opacity: 1}, 0.55);
            tl.set(micBot, {opacity: 1}, 0.55);
            tl.set(micWrapper, {opacity: 0}, 0.55);

            // Flash crack line at the 50% height of mic (mic is 80vh, bottom-aligned
            // the visual midpoint sits at ~50vh from bottom → 50vh from top ≈ top-[50vh])
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
        },
        {scope: containerRef},
    );

    // ══════════════════════════════════════════════════════════════════════
    //  On-mount: mic drop-in animation
    // ══════════════════════════════════════════════════════════════════════
    useGSAP(
        () => {
            if (!containerRef.current) return;
            gsap.from(".mic-element", {
                y: -150,
                opacity: 0,
                duration: MIC_INTRO_DURATION,
                ease: "elastic.out(1, 0.55)",
                delay: 0.1,
            });
        },
        {scope: containerRef},
    );

    // Ensure the page itself stays pinned at top while using section-based scrolling.
    useEffect(() => {
        if (section === "home" && window.scrollY !== 0) {
            window.scrollTo({top: 0, left: 0, behavior: "auto"});
        }
    }, [section]);

    // Handle ?section=... navigation from navbar without hashes
    useEffect(() => {
        const sectionParam = searchParams.get("section");

        if (!sectionParam) {
            scrubProgressRef.current = 0;
            if (animTimelineRef.current) {
                animTimelineRef.current.progress(0);
            }
            setSectionSynced("home");
            return;
        }

        if (!validSections.includes(sectionParam as Section)) {
            return;
        }

        const targetSection = sectionParam as Section;
        if (targetSection === "home") {
            scrubProgressRef.current = 0;
            if (animTimelineRef.current) {
                animTimelineRef.current.progress(0);
            }
        } else {
            scrubProgressRef.current = 1;
            if (animTimelineRef.current) {
                animTimelineRef.current.progress(1);
            }
        }

        setSectionSynced(targetSection);
    }, [searchParams]);

    // ══════════════════════════════════════════════════════════════════════
    //  Wheel handler — reads from sectionRef to avoid stale closures
    // ══════════════════════════════════════════════════════════════════════
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            const cur = sectionRef.current;
            const achievementsScroller = achievementsRef.current;
            const teamScroller = teamRef.current;
            const alumniScroller = alumniRef.current;
            const galleryScroller = galleryRef.current;

            if (cur === "achievements") {
                const atTop = achievementsScroller
                    ? achievementsScroller.scrollLeft <=
                      SECTION_BOUNDARY_EPSILON
                    : true;
                const maxScrollLeft = achievementsScroller
                    ? achievementsScroller.scrollWidth -
                      achievementsScroller.clientWidth
                    : 0;
                const atBottom = achievementsScroller
                    ? achievementsScroller.scrollLeft >=
                      maxScrollLeft - SECTION_BOUNDARY_EPSILON
                    : false;

                if (e.deltaY < 0 && atTop) {
                    e.preventDefault();
                    if (transitionLockRef.current) return;
                    lockTransition();
                    setSectionSynced("alumni");
                    return;
                }

                if (e.deltaY > 0 && atBottom) {
                    e.preventDefault();
                    if (transitionLockRef.current) return;
                    lockTransition();
                    setSectionSynced("gallery");
                }
                return;
            }

            if (cur === "gallery") {
                const atTop = galleryScroller
                    ? galleryScroller.scrollTop <= SECTION_BOUNDARY_EPSILON
                    : true;

                if (e.deltaY < 0 && atTop) {
                    e.preventDefault();
                    if (transitionLockRef.current) return;
                    lockTransition();
                    setSectionSynced("achievements");
                    return;
                }
                return;
            }

            // Team section: let it scroll natively, but intercept at the top to go back
            if (cur === "team") {
                const atTop = teamScroller
                    ? teamScroller.scrollTop <= SECTION_BOUNDARY_EPSILON
                    : true;
                const atBottom = teamScroller
                    ? Math.abs(
                          teamScroller.scrollHeight -
                              teamScroller.clientHeight -
                              teamScroller.scrollTop,
                      ) <= SECTION_BOUNDARY_EPSILON
                    : false;

                if (e.deltaY < 0 && atTop) {
                    // We are at the top and scrolling up — transition back to whychoose
                    e.preventDefault();
                    if (transitionLockRef.current) return;
                    lockTransition();
                    setSectionSynced("whychoose");
                    return;
                }

                if (e.deltaY > 0 && atBottom) {
                    // Move from Team into Alumni when user scrolls down at the end.
                    e.preventDefault();
                    if (transitionLockRef.current) return;
                    lockTransition();
                    setSectionSynced("alumni");
                }
                return;
            }

            // Alumni section: allow native internal scroll, but transition back to Team at the top.
            if (cur === "alumni") {
                if (!alumniScroller) return;

                const atTop =
                    alumniScroller.scrollTop <= SECTION_BOUNDARY_EPSILON;
                const atBottom =
                    Math.abs(
                        alumniScroller.scrollHeight -
                            alumniScroller.clientHeight -
                            alumniScroller.scrollTop,
                    ) <= SECTION_BOUNDARY_EPSILON;

                if (e.deltaY < 0 && atTop) {
                    e.preventDefault();
                    if (transitionLockRef.current) return;
                    lockTransition();
                    setSectionSynced("team");
                    return;
                }

                // Move from Alumni into Achievements when user scrolls down at the end.
                if (e.deltaY > 0 && atBottom) {
                    e.preventDefault();
                    if (transitionLockRef.current) return;
                    lockTransition();
                    setSectionSynced("achievements");
                }
                return;
            }

            // For all other sections we own the scroll
            e.preventDefault();

            // Ignore events right after a section change (prevents cascading)
            if (transitionLockRef.current) return;

            if (cur === "whychoose") {
                if (e.deltaY > 0) {
                    lockTransition();
                    setSectionSynced("team");
                } else if (e.deltaY < 0) {
                    lockTransition();
                    setSectionSynced("explore");
                }
                return;
            }

            if (cur === "home") {
                const tl = animTimelineRef.current;
                if (!tl) return;

                scrubProgressRef.current = Math.max(
                    0,
                    Math.min(
                        1.05,
                        scrubProgressRef.current +
                            e.deltaY * HOME_SCRUB_SENSITIVITY,
                    ),
                );

                gsap.to(tl, {
                    progress: Math.min(1, scrubProgressRef.current),
                    duration: HOME_SCRUB_TWEEN_DURATION,
                    ease: "power2.out",
                    onComplete: () => {
                        if (
                            scrubProgressRef.current >= 1.0 &&
                            sectionRef.current === "home"
                        ) {
                            lockTransition(800);
                            setSectionSynced("explore");
                        }
                    },
                });
                return;
            }

            if (cur === "explore") {
                const slider = sliderRef.current;

                if (e.deltaY < 0) {
                    if (!slider || slider.scrollLeft <= 2) {
                        // At the start — close explore and go back to home
                        lockTransition();
                        scrubProgressRef.current = 0;
                        gsap.to(animTimelineRef.current, {
                            progress: 0,
                            duration: 0.7,
                            ease: "power2.inOut",
                        });
                        setSectionSynced("home");
                    } else if (slider) {
                        slider.scrollBy({left: e.deltaY * 0.85});
                    }
                } else {
                    if (!slider) return;
                    const atEnd =
                        slider.scrollLeft + slider.clientWidth >=
                        slider.scrollWidth - 4;
                    if (atEnd) {
                        // At the end of cards — go to Why Choose (with lock!)
                        lockTransition();
                        setSectionSynced("whychoose");
                    } else {
                        slider.scrollBy({left: e.deltaY * 0.85});
                    }
                }
            }
        };

        window.addEventListener("wheel", handleWheel, {passive: false});
        return () => window.removeEventListener("wheel", handleWheel);
    }, []); // ← empty deps: we read section from sectionRef, never stale

    const openExplore = () => {
        scrubProgressRef.current = 1;
        gsap.to(animTimelineRef.current, {
            progress: 1,
            duration: OPEN_EXPLORE_DURATION,
            ease: "power2.inOut",
            onComplete: () => setSectionSynced("explore"),
        });
    };

    const closeExplore = () => {
        scrubProgressRef.current = 0;
        gsap.to(animTimelineRef.current, {
            progress: 0,
            duration: CLOSE_EXPLORE_DURATION,
            ease: "power2.inOut",
            onComplete: () => setSectionSynced("home"),
        });
    };

    // Derive CSS translate for the sliding container
    const containerTranslate =
        section === "gallery"
            ? "-translate-y-[500%]"
            : section === "achievements"
              ? "-translate-y-[400%]"
              : section === "alumni"
                ? "-translate-y-[300%]"
                : section === "team"
                  ? "-translate-y-[200%]"
                  : section === "whychoose"
                    ? "-translate-y-full"
                    : "translate-y-0";

    return (
        <>
            <div className="bg-[#000000] h-screen w-full overflow-hidden relative">
                {/* Sliding container — shifts up to reveal sub-sections */}
                <div
                    className={`w-full h-full relative transition-transform duration-1200 ease-[cubic-bezier(0.22,1,0.36,1)] ${containerTranslate}`}
                >
                    {/* ══════════════ MAIN HERO ══════════════ */}
                    <div
                        className="bg-[#000000] text-zinc-100 font-sans h-screen w-full overflow-hidden selection:bg-white/20 selection:text-white"
                        ref={containerRef}
                    >
                        <div
                            ref={stickyRef}
                            className="sticky top-0 w-full h-screen overflow-hidden"
                        >
                            {/* ── Main mic (GSAP moves this to centre) ───────────────── */}
                            {/*
              FIX: positioned at bottom-0, left-[10%] to start.
              GSAP animates left → 50% and xPercent → -50 so it centres perfectly.
              Split halves mirror this exact layout (bottom-0, left-1/2 -translate-x-1/2).
            */}
                            <div
                                ref={micWrapperRef}
                                className="mic-wrapper absolute bottom-0 z-10 pointer-events-none"
                                style={{left: "10%"}}
                            >
                                <img
                                    src="/mic-nobg.png"
                                    alt="Retro Microphone"
                                    className="mic-element h-[80vh] md:h-[90vh] w-auto object-contain object-bottom drop-shadow-[0_0_80px_rgba(255,255,255,0.15)]"
                                    style={{
                                        transformStyle: "preserve-3d",
                                        display: "block",
                                    }}
                                />
                            </div>

                            {/* ── Right content panel ─────────────────────────────────── */}
                            <div className="right-content-panel absolute top-0 right-0 w-full md:w-[50%] h-full flex flex-col justify-center items-end p-8 md:pr-12 z-0">
                                <div className="flex flex-col md:flex-row items-start justify-end gap-12 w-full mt-24">
                                    {/* Mission card */}
                                    <div className="hidden md:block bg-black/30 backdrop-blur-sm border border-white/10 rounded-sm p-6 max-w-55">
                                        <p className="text-xs text-zinc-400 uppercase tracking-[0.2em] mb-3 font-light">
                                            Mission
                                        </p>
                                        <p className="text-sm text-zinc-200 font-light leading-relaxed">
                                            We curate intellectual
                                            battlegrounds. To amplify voices,
                                            challenge perspectives, and elevate
                                            the debate.
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
                                            {navItems
                                                .slice(0, 2)
                                                .map((item, i) => (
                                                    <div
                                                        key={item.title}
                                                        className="relative w-36.25 h-25 group shrink-0 cursor-pointer overflow-hidden rounded-sm border border-white/10 bg-zinc-900"
                                                        onClick={() =>
                                                            navigateFromCard(
                                                                item,
                                                            )
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
                            <div className="hero-text-container absolute bottom-12 md:bottom-20 left-8 md:left-12 z-20 flex flex-col pointer-events-none">
                                <h1 className="hero-text text-[3rem] md:text-[5.5rem] lg:text-[7rem] font-light leading-[1.1] tracking-tight text-white mb-2 max-w-4xl drop-shadow-lg">
                                    DEBSOC:
                                    <br />
                                    <span className="text-zinc-300">
                                        THE ART OF ARGUMENT.
                                    </span>
                                </h1>
                                <p className="hero-text text-sm md:text-lg text-zinc-400 font-light max-w-md mt-2 tracking-wide leading-relaxed drop-shadow">
                                    A high-end production studio for <br />
                                    discourse and debate.
                                </p>
                            </div>

                            {/* ── Footer links ────────────────────────────────────────── */}
                            <div className="absolute bottom-8 right-8 md:right-12 z-20 flex gap-6 text-xs text-zinc-400 font-light tracking-wider">
                                <button
                                    onClick={() => setSectionSynced("team")}
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
                                    className="hover:text-white transition-colors underline underline-offset-4 decoration-zinc-600 hover:decoration-white"
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
                                className={`absolute inset-0 z-100 flex items-center justify-start ${
                                    section === "explore"
                                        ? "pointer-events-auto"
                                        : "pointer-events-none"
                                }`}
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
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 will-change-transform"
                                        style={{clipPath: "inset(0 0 50% 0)"}}
                                    >
                                        <img
                                            src="/mic-nobg.png"
                                            alt=""
                                            className="h-[80vh] md:h-[90vh] w-auto object-contain object-bottom drop-shadow-[0_0_60px_rgba(255,255,255,0.25)]"
                                            style={{display: "block"}}
                                        />
                                    </div>

                                    {/* Bottom half (clips top 50% of image) */}
                                    <div
                                        ref={micBotRef}
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 will-change-transform"
                                        style={{clipPath: "inset(50% 0 0 0)"}}
                                    >
                                        <img
                                            src="/mic-nobg.png"
                                            alt=""
                                            className="h-[80vh] md:h-[90vh] w-auto object-contain object-bottom drop-shadow-[0_0_60px_rgba(255,255,255,0.25)]"
                                            style={{display: "block"}}
                                        />
                                    </div>

                                    {/* Crack / light flash — positioned at 50% height of an 80vh mic = 60vh from top */}
                                    <div
                                        ref={crackRef}
                                        className="absolute w-full h-0.75 bg-white shadow-[0_0_100px_24px_rgba(255,255,255,0.95)] origin-center will-change-transform"
                                        style={{bottom: "40vh"}} // midpoint of 80vh mic sitting at bottom
                                    />
                                </div>

                                {/* Fullscreen card slider */}
                                <div
                                    ref={sliderRef}
                                    className="relative z-105 flex gap-10 px-[8vw] overflow-x-auto w-full h-[65vh] md:h-[72vh] items-center hide-scrollbar"
                                >
                                    {navItems.map((item, i) => (
                                        <div
                                            key={item.title}
                                            onClick={() =>
                                                navigateFromCard(item)
                                            }
                                            className="relative min-w-75 md:min-w-105 lg:min-w-125 h-full group shrink-0 cursor-pointer overflow-hidden rounded border border-white/10 bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
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
                                                    <span className="text-zinc-300 text-lg md:text-2xl">
                                                        {item.sub1}
                                                    </span>
                                                    <br />
                                                    <span className="text-zinc-400 text-base md:text-lg">
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

                    <WhyChooseDebsoc
                        isWhyChooseOpen={section === "whychoose"}
                        whyChooseRef={whyChooseRef}
                    />
                    <TeamSection
                        isTeamOpen={section === "team"}
                        teamRef={teamRef}
                    />
                    <div
                        ref={alumniRef}
                        className="absolute left-0 w-full h-screen overflow-y-auto hide-scrollbar bg-[#000000]"
                        style={{top: "300%"}}
                    >
                        <AlumniSection />
                    </div>
                    <AchievementSection
                        isAchievementsOpen={section === "achievements"}
                        achievementsRef={achievementsRef}
                    />
                    <GallerySection
                        isGalleryOpen={section === "gallery"}
                        galleryRef={galleryRef}
                    />
                </div>

                <style
                    dangerouslySetInnerHTML={{
                        __html: `.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`,
                    }}
                />
            </div>
        </>
    );
}
