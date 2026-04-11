"use client";

import React, {useRef, useEffect, useState} from "react";
import Image from "next/image";
import {ArrowUpRight, Trophy, Award, Star} from "lucide-react";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {useGSAP} from "@gsap/react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface Achievement {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    image: string;
    icon: React.ReactNode;
}

const ACHIEVEMENTS: Achievement[] = [
    {
        id: "01",
        title: "National Debate Premier League",
        date: "March 2025",
        location: "New Delhi, India",
        description:
            "Secured first place in the most prestigious parliamentary debate tournament, outperforming 50+ premier institutions with an undefeated run.",
        image: "/event1.png",
        icon: <Trophy size={16} className="text-zinc-400" />,
    },
    {
        id: "02",
        title: "Asian Parliamentary Championship",
        date: "November 2024",
        location: "Kuala Lumpur, Malaysia",
        description:
            "Awarded Best Adjudicator and reached the grand finals. Recognized globally for unparalleled analytical rigor and discourse management.",
        image: "/event2.png",
        icon: <Award size={16} className="text-zinc-400" />,
    },
    {
        id: "03",
        title: "Literary Lane Symposium",
        date: "August 2024",
        location: "Bangalore, India",
        description:
            "Hosted the largest ever intercollegiate literary fest with over 2000 attendees, cementing DEBSOC as a paragon of intellectual culture.",
        image: "/event1.png",
        icon: <Star size={16} className="text-zinc-400" />,
    },
    {
        id: "04",
        title: "Global Model UN",
        date: "May 2024",
        location: "Geneva, Switzerland",
        description:
            "Delegation earned multiple 'Best Delegate' awards. Commended for exceptional diplomatic strategy and policy formulation.",
        image: "/event2.png",
        icon: <Trophy size={16} className="text-zinc-400" />,
    },
];

export default function AchievementSection() {
    const [flippedId, setFlippedId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const internalScrollRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = internalScrollRef;

    // Initial entry animations
    useGSAP(
        () => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 75%",
                }
            });

            // Header animation
            tl.fromTo(
                ".achievements-header span",
                {y: 50, opacity: 0},
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    stagger: 0.1,
                    ease: "power4.out",
                },
            );

            // Cards animation
            tl.fromTo(
                ".achievement-card",
                {x: 150, opacity: 0, scale: 0.95},
                {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 1.2,
                    stagger: 0.15,
                    ease: "power3.out",
                },
                "-=0.6",
            );
        },
        {scope: containerRef},
    );

    // Auto-scroll logic every 5 seconds
    useEffect(() => {
        if (!scrollContainerRef.current || flippedId !== null) return;

        const scrollContainer = scrollContainerRef.current;
        let playhead = setInterval(() => {
            const maxScroll =
                scrollContainer.scrollWidth - scrollContainer.clientWidth;
            // Scroll to next card, if at end, snap back to start
            if (scrollContainer.scrollLeft >= maxScroll - 50) {
                scrollContainer.scrollTo({left: 0, behavior: "smooth"});
            } else {
                scrollContainer.scrollBy({
                    left: scrollContainer.clientWidth * 0.7,
                    behavior: "smooth",
                });
            }
        }, 5000);

        return () => clearInterval(playhead);
    }, [flippedId]);

    return (
        <div
            id="achievements"
            ref={containerRef}
            className="relative w-full overflow-hidden bg-[#020202] flex flex-col z-40 text-white min-h-screen pt-12 pb-12"
        >
            {/* Background Texture / Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] md:text-[25rem] font-black text-white/[0.015] leading-none pointer-events-none select-none whitespace-nowrap z-0">
                GLORY
            </div>

            {/* Navigation Header */}
            <div className="absolute top-0 left-0 w-full flex justify-between items-center p-8 md:px-12 z-30">
                <span className="text-[9px] md:text-xs tracking-[0.4em] uppercase text-zinc-500 font-light mix-blend-difference">
                    Legacy / Milestones / 2026
                </span>
                <span className="text-[9px] md:text-xs tracking-[0.2em] uppercase text-zinc-600 font-light mix-blend-difference">
                    Hall of Trophies
                </span>
            </div>

            {/* Main Content Area */}
            <div className="w-full h-full px-4 sm:px-8 md:px-12 pb-8 sm:pb-12 z-10 flex flex-col pt-20 sm:pt-24 md:pt-32">
                {/* Header Section */}
                <div className="achievements-header mb-4 sm:mb-8 md:mb-12 shrink-0 flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
                    <h1 className="text-[clamp(2.5rem,7vw,6.5rem)] font-black leading-none tracking-[-0.04em] uppercase text-white flex flex-wrap gap-x-4">
                        <span className="inline-block overflow-hidden">
                            <span className="inline-block">HALL</span>
                        </span>
                        <span className="inline-block overflow-hidden text-zinc-500">
                            <span className="inline-block">OF</span>
                        </span>
                        <span className="inline-block overflow-hidden">
                            <span className="inline-block">FAME</span>
                        </span>
                    </h1>
                    <div className="max-w-md lg:pb-3">
                        <p className="text-zinc-400 text-sm md:text-base font-light leading-relaxed tracking-wide">
                            Forged in the fires of intellectual combat. A ledger
                            of our most definitive victories and milestones
                            across the global debate circuit.
                        </p>
                    </div>
                </div>

                {/* Horizontal Scroll Cards Section */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 w-full flex gap-4 sm:gap-6 md:gap-10 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4 sm:pb-8 items-center"
                    style={{
                        maskImage:
                            "linear-gradient(to right, black 85%, transparent 100%)",
                        WebkitMaskImage:
                            "linear-gradient(to right, black 85%, transparent 100%)",
                    }}
                >
                    {ACHIEVEMENTS.map((item) => {
                        const isFlipped = flippedId === item.id;
                        return (
                            <div
                                key={item.id}
                                onClick={() =>
                                    setFlippedId(isFlipped ? null : item.id)
                                }
                                className="achievement-card relative group flex-shrink-0 w-[85vw] sm:w-[75vw] md:w-[600px] h-[45vh] sm:h-[50vh] md:h-[60vh] max-h-[600px] snap-center cursor-pointer"
                                style={{perspective: "1500px"}}
                            >
                                <div
                                    className="w-full h-full relative transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                                    style={{
                                        transformStyle: "preserve-3d",
                                        transform: isFlipped
                                            ? "rotateY(180deg)"
                                            : "rotateY(0deg)",
                                    }}
                                >
                                    {/* ────── FRONT FACE ────── */}
                                    <div
                                        className="absolute inset-0 w-full h-full overflow-hidden border border-white/5 bg-zinc-900/50"
                                        style={{backfaceVisibility: "hidden"}}
                                    >
                                        {/* Front Image Layer */}
                                        <div className="absolute inset-0 z-0">
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                className="object-cover grayscale brightness-50 contrast-125 group-hover:grayscale-0 group-hover:brightness-90 transition-all duration-[1200ms] ease-out scale-105"
                                                sizes="(max-width: 768px) 100vw, 600px"
                                            />
                                            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-colors duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/40 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-700" />
                                        </div>

                                        {/* Front Content Layer */}
                                        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 md:p-10">
                                            {/* Top metadata */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        {item.icon}
                                                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-zinc-400 group-hover:text-white transition-colors duration-500">
                                                            {item.date}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] md:text-xs font-light uppercase tracking-widest text-zinc-500">
                                                        {item.location}
                                                    </span>
                                                </div>
                                                <div className="text-[2rem] md:text-[3rem] font-black text-white/10 group-hover:text-white/30 transition-colors duration-500 leading-none">
                                                    {item.id}
                                                </div>
                                            </div>

                                            {/* Bottom content */}
                                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700 ease-out">
                                                <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white leading-[1.1] mb-4">
                                                    {item.title}
                                                </h3>
                                                <div className="flex flex-col gap-4 overflow-hidden">
                                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 group-hover:text-white group/btn self-start mt-2 transition-colors duration-500">
                                                        <span>
                                                            Click to view more!
                                                        </span>
                                                        <ArrowUpRight
                                                            size={14}
                                                            className="transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Accent Line */}
                                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 origin-left ease-[cubic-bezier(0.22,1,0.36,1)] z-20" />
                                    </div>

                                    {/* ────── BACK FACE ────── */}
                                    <div
                                        className="absolute inset-0 w-full h-full overflow-hidden border border-white/10 bg-[#050505] flex flex-col z-20 group/back hover:border-white/20 transition-colors duration-500"
                                        style={{
                                            backfaceVisibility: "hidden",
                                            transform: "rotateY(180deg)",
                                        }}
                                    >
                                        {/* Back Face Glow styling */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none" />

                                        <div className="flex-1 p-6 md:p-10 flex flex-col justify-center">
                                            <div className="flex items-center gap-3 mb-6 opacity-60">
                                                {item.icon}
                                                <span className="text-[10px] md:text-xs font-light uppercase tracking-widest text-zinc-400">
                                                    Match Overview
                                                </span>
                                            </div>
                                            <h4 className="text-xl md:text-3xl font-black uppercase tracking-tight text-white mb-6 leading-tight">
                                                {item.title}
                                            </h4>
                                            <p className="text-base md:text-lg text-zinc-400 font-light leading-relaxed group-hover/back:text-zinc-300 transition-colors duration-500">
                                                {item.description}
                                            </p>
                                            <div className="mt-auto pt-6 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white">
                                                    Turn Back
                                                </span>
                                            </div>
                                        </div>
                                        {/* Always visible solid line for the back face */}
                                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/20 z-20" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Ghost card for padding at the end of the scroll container */}
                    <div className="flex-shrink-0 w-[4vw] md:w-[8vw] h-full" />
                </div>
            </div>

            {/* To support the inner scrollbar hiding */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`,
                }}
            />
        </div>
    );
}
