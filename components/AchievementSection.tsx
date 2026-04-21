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
        title: "Champions at NUALS Kochi PD '26",
        date: "March 2026",
        location: "Kochi, Kerala (offline)",
        description:
            "Massive congratulations to Srejoni and Dhruv for an outstanding performance at NUALS Kochi PD '26. Emerging as the Novice Champions, they navigated a competitive field of 41 teams to claim the top spot",
        image: "/achievement/ach1.jpeg",
        icon: <Trophy size={16} className="text-zinc-400" />,
    },
    {
        id: "02",
        title: "Reserve Novice Break at NLSD XXIII",
        date: "April 2026",
        location: "Bengaluru, Karnataka (Offline)",
        description:
            "A huge shoutout to Dhruv, Prachi, and Rishikesh for their stellar performance at NLSD XXIII, hosted by NLSIU. In a tough field of 41 teams, the trio secured the Reserve Novice Break, demonstrating exceptional skill and composure. While they missed the Novice Semifinals by a mere two speaker points, their clinical execution and teamwork stood out. We are immensely proud of this high-level consistency!",
        image: "/achievement/ach2.jpeg",
        icon: <Award size={16} className="text-zinc-400" />,
    },
    {
        id: "03",
        title: "Adjudicator break at Vacation Spar 2025",
        date: "December 2025",
        location: "Ghana (Online)",
        description:
            "Congratulations to Aditya Kumar Singh for an exceptional performance at Vacation Spar 2025, an international tournament hosted online from Ghana. Aditya’s analytical precision earned him an Adjudicator Break, culminating in a prestigious appointment as a Novice Finals Panelist. His ability to dissect complex arguments with clarity and provide nuanced feedback stood out on the global stage. We are thrilled to celebrate his growing reputation as a top-tier adjudicator!",
        image: "/achievement/ach3.png",
        icon: <Star size={16} className="text-zinc-400" />,
    },
    {
        id: "04",
        title: "Open Semifinalist at BITS Goa Contention PD '24",
        date: "November, 2024",
        location: "Goa, India",
        description:
            "A massive round of applause for Srejoni and Rohan for their historic run at BITS Goa Contention PD '24. Breaking into the Open Category, the duo displayed relentless grit and tactical brilliance to advance all the way to the Open Semifinals. Competing against some of the circuit's most seasoned debaters, their achievement marks a significant milestone for our society. We are incredibly proud of this high-level finish and the standard they’ve set",
        image: "/achievement/ach4.jpg",
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
                },
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
            className="relative w-full overflow-hidden bg-[#020202] flex flex-col z-40 text-white min-h-[100svh] pt-12 pb-12"
        >
            {/* Background Texture / Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] md:text-[25rem] font-black text-white/[0.015] leading-none pointer-events-none select-none whitespace-nowrap z-0">
                GLORY
            </div>

            {/* Main Content Area */}
            <div className="w-full h-full px-4 sm:px-8 md:px-12 pb-4 sm:pb-8 z-10 flex flex-col pt-12 sm:pt-16 md:pt-20">
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
                            Built through rigorous debate and competition, The Hall of Fame is the record of our most significant achievements and milestones in the debating circuit by our fellow members.
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
                                className="achievement-card relative group flex-shrink-0 w-[90vw] max-w-[650px] sm:w-[80vw] md:w-[700px] h-[clamp(380px,55svh,600px)] sm:h-[60vh] md:h-[70vh] max-h-[750px] snap-center cursor-pointer"
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
