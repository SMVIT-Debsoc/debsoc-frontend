"use client";

import React, {useState, useEffect, useRef} from "react";
import {motion, AnimatePresence, useScroll, useTransform} from "framer-motion";
import Navbar from "@/components/Navbar";
import toast, {Toaster} from "react-hot-toast";
import {
    Sparkles,
    RefreshCw,
    Info,
    ChevronRight,
    BookOpen,
    Layers,
    Users,
    Zap,
    Timer,
    PenTool,
    Hash,
    Target,
    ChevronDown,
} from "lucide-react";
import {motionData, MotionItem} from "@/lib/motion";
import {ElegantShape} from "@/components/ui/shape-landing-hero";

const getRandomMotions = (count = 1) => {
    if (!motionData || motionData.length === 0) return [];
    const shuffled = [...motionData].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, motionData.length));
};

export default function Session() {
    const [motions, setMotions] = useState<MotionItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [navHeight, setNavHeight] = useState(88);
    const containerRef = useRef(null);
    const {scrollYProgress} = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    useEffect(() => {
        setMotions(getRandomMotions());
    }, []);

    useEffect(() => {
        const updateNavHeight = () => {
            const nav = document.querySelector("nav");
            if (!nav) return;
            setNavHeight(nav.getBoundingClientRect().height);
        };

        updateNavHeight();

        let observer: ResizeObserver | null = null;
        const nav = document.querySelector("nav");
        if (nav && typeof ResizeObserver !== "undefined") {
            observer = new ResizeObserver(updateNavHeight);
            observer.observe(nav);
        }

        window.addEventListener("resize", updateNavHeight);
        return () => {
            window.removeEventListener("resize", updateNavHeight);
            observer?.disconnect();
        };
    }, []);

    const handleNewMotion = async () => {
        setIsGenerating(true);
        const loadNewMotion = new Promise((resolve) => {
            setTimeout(() => {
                const newMotions = getRandomMotions();
                setMotions(newMotions);
                setIsGenerating(false);
                resolve(newMotions);
            }, 1200);
        });

        toast.promise(
            loadNewMotion,
            {
                loading: "Synthesizing discourse...",
                success: "Motion generated.",
                error: "Interference detected.",
            },
            {
                style: {
                    borderRadius: "0px",
                    background: "#09090b",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                },
            },
        );
    };

    return (
        <div
            ref={containerRef}
            className="relative min-h-screen bg-[#030303] text-zinc-300 font-sans selection:bg-white selection:text-black overflow-x-hidden"
        >
            <Toaster position="bottom-right" />
            <Navbar />

            {/* BACKGROUND DECORATION */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-rose-500/10 blur-[220px]" />
                <div className="absolute inset-0 bg-black/25 backdrop-blur-[80px]" />
                <div className="absolute inset-0 overflow-hidden">
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
                        className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                    />
                    <ElegantShape
                        delay={0.6}
                        width={200}
                        height={60}
                        rotate={20}
                        gradient="from-amber-500/[0.15]"
                        className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                    />
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-black/10 blur-[120px]" />
                <div className="absolute top-0 left-1/4 w-px h-full bg-white/5" />
                <div className="absolute top-0 right-1/4 w-px h-full bg-white/5" />
            </div>

            <main
                className="relative z-10 max-w-7xl mx-auto px-6 md:px-12"
                style={{paddingTop: navHeight}}
            >
                {/* HERO: ONE-FRAME MOTION LAB */}
                <section
                    className="flex flex-col items-center justify-center overflow-hidden relative"
                    style={{minHeight: `calc(100svh - ${navHeight}px)`}}
                >
                    <div className="absolute inset-0 flex items-center justify-center -z-10">
                        <div className="w-[800px] h-[800px] bg-zinc-900/40 blur-[200px] rounded-full" />
                    </div>

                    <div className="w-full flex flex-col items-center text-center space-y-12 max-h-[95vh] relative z-20">
                        <motion.div
                            initial={{opacity: 0, y: -20}}
                            animate={{opacity: 1, y: 0}}
                            className="space-y-6 relative z-10"
                        >
                            <div className="flex items-center justify-center gap-4">
                                <div className="h-px w-10 bg-zinc-700" />
                                <span className="text-zinc-500 font-medium tracking-[0.5em] uppercase text-[10px]">
                                    Argumentation Forge
                                </span>
                                <div className="h-px w-10 bg-zinc-700" />
                            </div>
                            <h1 className="text-5xl md:text-8xl font-light tracking-tighter text-white uppercase italic leading-none relative">
                                Motion{" "}
                                <span className="text-zinc-500 not-italic">
                                    Engine
                                </span>
                            </h1>
                        </motion.div>

                        <div className="w-full max-w-5xl relative px-4 z-20">
                            <AnimatePresence mode="wait">
                                {motions.length > 0 ? (
                                    <motion.div
                                        key={motions[0].motion}
                                        initial={{
                                            opacity: 0,
                                            y: 20,
                                            filter: "blur(10px)",
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            filter: "blur(0px)",
                                        }}
                                        exit={{
                                            opacity: 0,
                                            y: -20,
                                            filter: "blur(10px)",
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            ease: [0.16, 1, 0.3, 1],
                                        }}
                                        className="relative w-full bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 p-10 md:p-14 rounded-sm shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-8 mb-8">
                                            <div className="flex items-center gap-6">
                                                <span className="px-5 py-2 bg-white text-black text-[11px] uppercase tracking-[0.2em] font-black rounded-full">
                                                    {
                                                        motions[0].types.split(
                                                            " ",
                                                        )[0]
                                                    }
                                                </span>
                                                <div className="h-5 w-px bg-white/20" />
                                                <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-bold italic">
                                                    Official Protocol
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono font-bold font-black">
                                                    System Active
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-3xl md:text-5xl font-light text-white leading-tight tracking-tight italic">
                                            "{motions[0].motion}"
                                        </h3>

                                        <div className="mt-10 flex flex-col items-center gap-8">
                                            <div className="w-full max-w-3xl space-y-4 text-center">
                                                <p className="text-zinc-200 text-lg leading-relaxed font-light italic border-t border-white/5 pt-8">
                                                    {motions[0].InfoSlide ||
                                                        "Strategic information slide is currently undergoing synthesis."}
                                                </p>
                                            </div>

                                            <motion.button
                                                whileHover={{
                                                    scale: 1.05,
                                                    backgroundColor: "#fff",
                                                    color: "#000",
                                                    boxShadow:
                                                        "0 0 50px rgba(255,255,255,0.2)",
                                                }}
                                                whileTap={{scale: 0.95}}
                                                onClick={handleNewMotion}
                                                disabled={isGenerating}
                                                className="flex items-center gap-6 px-12 py-5 border border-white/20 text-white text-[11px] uppercase tracking-[0.5em] font-black transition-all disabled:opacity-50"
                                            >
                                                <RefreshCw
                                                    size={16}
                                                    className={
                                                        isGenerating
                                                            ? "animate-spin"
                                                            : ""
                                                    }
                                                />
                                                Initialize Sequence
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center gap-8">
                                        <div className="w-16 h-16 border-4 border-white/5 border-t-white animate-spin rounded-full" />
                                        <span className="text-xs text-zinc-400 uppercase tracking-[1em] animate-pulse font-bold">
                                            Initializing
                                        </span>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </section>

                <section className="space-y-64 py-40">
                    {/* SECTION: THE PROTOCOLS (FORMATS) */}
                    <section className="scroll-mt-32 pt-16 md:pt-24 space-y-32 max-w-screen-2xl mx-auto">
                        <div className="flex flex-col items-center text-center space-y-8">
                            <div className="px-6 py-2 bg-white/5 border border-white/10 text-[11px] text-zinc-400 uppercase tracking-[0.5em] font-bold">
                                The Protocols
                            </div>
                            <h2 className="text-5xl md:text-8xl font-light text-white uppercase italic tracking-tighter">
                                Debate{" "}
                                <span className="text-zinc-600 not-italic">
                                    Mechanics
                                </span>
                            </h2>
                        </div>

                        <div className="mt-12 md:mt-16 grid lg:grid-cols-2 gap-12 bg-transparent overflow-hidden">
                            {/* BP FORMAT */}
                            <div className="group relative bg-[#0a0a0a] p-16 md:p-24 space-y-16 border border-white/5 hover:border-white/20 transition-all duration-700 rounded-sm hover:-translate-y-2">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 space-y-12 text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="w-20 h-20 border border-white/10 flex items-center justify-center text-white ring-1 ring-white/5 group-hover:ring-white/20 transition-all">
                                            <Timer size={36} strokeWidth={1} />
                                        </div>
                                        <span className="text-[80px] font-black text-white/[0.05] group-hover:text-white/[0.08] transition-colors font-mono">
                                            BP
                                        </span>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-4xl md:text-5xl text-white font-light uppercase tracking-widest italic leading-none">
                                            British <br />{" "}
                                            <span className="text-zinc-500 not-italic">
                                                Parliamentary
                                            </span>
                                        </h3>
                                        <p className="text-lg text-zinc-400 leading-relaxed font-light max-w-xl">
                                            The vertical challenge. Two teams on
                                            each side, competing both against
                                            the opposition and their partners
                                            for the best extension.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-12 py-12 border-y border-white/5">
                                        <div className="space-y-3">
                                            <p className="text-[11px] text-zinc-500 uppercase tracking-[0.4em] font-black">
                                                Preparation
                                            </p>
                                            <p className="text-3xl text-white font-light tracking-tight italic">
                                                15 Minutes{" "}
                                                <span className="text-zinc-600 text-sm tracking-normal font-sans uppercase">
                                                    Fixed
                                                </span>
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[11px] text-zinc-500 uppercase tracking-[0.4em] font-black">
                                                Participant Load
                                            </p>
                                            <p className="text-3xl text-white font-light tracking-tight italic">
                                                08{" "}
                                                <span className="text-zinc-600 text-sm tracking-normal font-sans uppercase">
                                                    Speakers
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <p className="text-[11px] text-zinc-500 uppercase tracking-[0.5em] font-black underline underline-offset-8 decoration-white/10">
                                            Dynamic Speaker Order
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            {[
                                                "PM",
                                                "LO",
                                                "DPM",
                                                "DLO",
                                                "MG",
                                                "MO",
                                                "GW",
                                                "OW",
                                            ].map((s, i) => (
                                                <div
                                                    key={s}
                                                    className="px-5 py-3 bg-white text-black border border-white/10 text-[12px] font-black shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                                >
                                                    <span className="text-black/40 mr-2">
                                                        {String(i + 1).padStart(
                                                            2,
                                                            "0",
                                                        )}
                                                    </span>{" "}
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ASIAN FORMAT */}
                            <div className="group relative bg-[#0a0a0a] p-16 md:p-24 space-y-16 border border-white/5 hover:border-white/20 transition-all duration-700 rounded-sm hover:-translate-y-2">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 space-y-12 text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="w-20 h-20 border border-white/10 flex items-center justify-center text-white ring-1 ring-white/5 group-hover:ring-white/20 transition-all">
                                            <Users size={36} strokeWidth={1} />
                                        </div>
                                        <span className="text-[80px] font-black text-white/[0.05] group-hover:text-white/[0.08] transition-colors font-mono">
                                            AP
                                        </span>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-4xl md:text-5xl text-white font-light uppercase tracking-widest italic leading-none">
                                            Asian <br />{" "}
                                            <span className="text-zinc-500 not-italic">
                                                Parliamentary
                                            </span>
                                        </h3>
                                        <p className="text-lg text-zinc-400 leading-relaxed font-light max-w-xl">
                                            The classic confrontation. 3v3 focus
                                            on internal consistency, deep
                                            logical layers, and devastating
                                            reply speeches.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-12 py-12 border-y border-white/5">
                                        <div className="space-y-3">
                                            <p className="text-[11px] text-zinc-500 uppercase tracking-[0.4em] font-black">
                                                Preparation
                                            </p>
                                            <p className="text-3xl text-white font-light tracking-tight italic">
                                                30 Minutes{" "}
                                                <span className="text-zinc-600 text-sm tracking-normal font-sans uppercase">
                                                    Total
                                                </span>
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[11px] text-zinc-500 uppercase tracking-[0.4em] font-black">
                                                Reply Phase
                                            </p>
                                            <p className="text-3xl text-white font-light tracking-tight italic">
                                                04{" "}
                                                <span className="text-zinc-600 text-sm tracking-normal font-sans uppercase">
                                                    Minutes
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <p className="text-[11px] text-zinc-500 uppercase tracking-[0.5em] font-black underline underline-offset-8 decoration-white/10">
                                            Standard Protocol
                                        </p>
                                        <div className="flex flex-wrap gap-4 text-white text-[14px] items-center font-black">
                                            {[
                                                "PM",
                                                "LO",
                                                "DPM",
                                                "DLO",
                                                "GW",
                                                "OW",
                                            ].map((s, idx) => (
                                                <React.Fragment key={s}>
                                                    <span className="px-4 py-2 bg-white/10 border border-white/10 hover:bg-white hover:text-black transition-colors">
                                                        {s}
                                                    </span>
                                                    {idx < 5 && (
                                                        <ChevronRight
                                                            size={14}
                                                            className="text-zinc-600"
                                                        />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                            <span className="text-white bg-zinc-800 px-4 py-2 italic font-light uppercase tracking-widest text-[11px]">
                                                Reply: Opp → Gov
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION: STRATEGY NODES */}
                    <section className="relative py-32 px-10 bg-zinc-900/10 border border-white/5 overflow-hidden rounded-sm">
                        <div className="absolute top-0 right-0 w-2/3 h-full overflow-hidden opacity-30 transform translate-x-10 pointer-events-none">
                            <div className="w-full h-full bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:40px_40px]" />
                        </div>

                        <div className="flex flex-col xl:flex-row items-center justify-between gap-24 relative z-10">
                            <div className="xl:w-1/3 space-y-10 text-left">
                                <div className="space-y-6">
                                    <p className="text-[11px] text-zinc-500 uppercase tracking-[0.6em] font-black border-l-4 border-white pl-6">
                                        02 Core Theory
                                    </p>
                                    <h2 className="text-6xl text-white font-light uppercase tracking-tighter leading-tight italic">
                                        Strategic <br />{" "}
                                        <span className="text-zinc-600 not-italic">
                                            Foundation
                                        </span>
                                    </h2>
                                </div>
                                <p className="text-xl text-zinc-200 leading-relaxed font-light">
                                    Debate is won in the prep room.
                                    Understanding these three pillars ensures
                                    you are debating from a position of
                                    authority, not reaction.
                                </p>
                                <div className="pt-10 flex gap-4">
                                    <div className="w-20 h-px bg-white" />
                                    <div className="w-4 h-px bg-white/20" />
                                </div>
                            </div>

                            <div className="xl:w-2/3 grid md:grid-cols-1 gap-4">
                                {[
                                    {
                                        icon: <Zap size={32} />,
                                        title: "POI Integration",
                                        desc: "Points of Information should not be random questions. They are strategic interventions meant to force a speaker into a logical binary or reveal a lack of structural nuance.",
                                    },
                                    {
                                        icon: <Layers size={32} />,
                                        title: "The Mechanism Layer",
                                        desc: "In 'THW' motions, your mechanism is your shield. Define the implementation detail to pre-empt 'Does not work' arguments and control the debate's environment.",
                                    },
                                    {
                                        icon: <Target size={32} />,
                                        title: "Fiat Equilibrium",
                                        desc: "Both sides possess equal Fiat. If the Gov can claim they pass a law, the Opp can claim they implement an alternative policy with the same degree of executive power.",
                                    },
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className="group bg-black/40 backdrop-blur-md p-10 flex flex-col md:flex-row gap-10 border border-white/5 hover:border-white/20 transition-all rounded-sm"
                                    >
                                        <div className="text-white group-hover:scale-110 transition-transform pt-1">
                                            {item.icon}
                                        </div>
                                        <div className="space-y-4 text-left">
                                            <h4 className="text-2xl text-white font-medium uppercase tracking-[0.2em]">
                                                {item.title}
                                            </h4>
                                            <p className="text-lg text-zinc-300 leading-relaxed font-light group-hover:text-white transition-colors">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* SECTION: MOTION TAXONOMY */}
                    <section className="space-y-24">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/20 pb-12">
                            <div className="space-y-6">
                                <p className="text-[11px] text-zinc-500 uppercase tracking-[0.6em] font-black">
                                    03 Taxonomy
                                </p>
                                <h2 className="text-5xl md:text-8xl font-light text-white uppercase italic tracking-tighter">
                                    Motion{" "}
                                    <span className="text-zinc-600 not-italic">
                                        Classification
                                    </span>
                                </h2>
                            </div>
                            <p className="max-w-md text-[12px] text-zinc-400 uppercase tracking-[0.3em] font-bold leading-relaxed text-right">
                                Different burdens for different battlegrounds.
                                Identify the motion type to win the clash
                                instantly.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    tag: "THBT",
                                    title: "Believes That",
                                    desc: "Analysis of values, trends, or facts. No mechanism required. Focus on the internal logic and 'Truth' of the claim's premise.",
                                },
                                {
                                    tag: "THW",
                                    title: "This House Would",
                                    desc: "Action-oriented policy debating. Requires a clear model. Focus on consequences and the practical 'Should' of implementation.",
                                },
                                {
                                    tag: "THR",
                                    title: "This House Regrets",
                                    desc: "A world without X. Compare reality with a specific counterfactual alternative. Evaluate the historical and psychological impacts.",
                                },
                                {
                                    tag: "THS",
                                    title: "This House Supports",
                                    desc: "Moral or pragmatic alignment with a trend. You take the reputation of the side you support and defend its existence.",
                                },
                                {
                                    tag: "TH, as X",
                                    title: "Actor Perspectives",
                                    desc: "Incentive-based debate. Argue purely from the best interests of 'X', regardless of global morality or fairness.",
                                },
                                {
                                    tag: "THO",
                                    title: "This House Opposes",
                                    desc: "The antithesis of support. Often used to critique existing societal norms, virtue-signalling, or destructive cultural trends.",
                                },
                            ].map((type) => (
                                <div
                                    key={type.tag}
                                    className="bg-[#080808] p-16 group hover:bg-[#0c0c0c] border border-white/5 hover:border-white/30 transition-all duration-500 relative overflow-hidden rounded-sm text-left"
                                >
                                    <div className="absolute -right-8 -bottom-8 text-[120px] font-black text-white/[0.02] group-hover:text-white/[0.05] transition-all duration-700 pointer-events-none">
                                        {type.tag}
                                    </div>
                                    <div className="relative z-10 space-y-8">
                                        <div className="text-[11px] text-zinc-500 uppercase tracking-[0.5em] mb-4 group-hover:text-white transition-colors flex items-center gap-3 font-black">
                                            <span className="w-2 h-2 rounded-full bg-zinc-800 group-hover:bg-white" />
                                            {type.tag}
                                        </div>
                                        <h4 className="text-3xl text-white font-light group-hover:italic group-hover:pl-2 transition-all leading-tight">
                                            {type.tag === "THW" ? (
                                                <>
                                                    <span className="block">
                                                        This House
                                                    </span>
                                                    <span className="block">
                                                        Would
                                                    </span>
                                                </>
                                            ) : (
                                                type.title
                                            )}
                                        </h4>
                                        <p className="text-lg text-zinc-300 leading-relaxed font-light group-hover:text-white transition-colors">
                                            {type.desc}
                                        </p>
                                        <motion.div
                                            whileHover={{x: 10}}
                                            className="pt-8 flex items-center gap-4 text-[10px] text-white uppercase tracking-[0.5em] cursor-pointer font-black border-t border-white/5 mt-auto"
                                        >
                                            View Strategic Playbook{" "}
                                            <ChevronRight size={14} />
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SECTION: PREP CHECKLIST */}
                    <section className="grid lg:grid-cols-2 gap-24 p-20 bg-zinc-900/5 border border-white/10 rounded-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                        <div className="space-y-12 relative z-10 text-left">
                            <div className="space-y-6">
                                <p className="text-[11px] text-zinc-500 uppercase tracking-[0.6em] font-black">
                                    04 Preparation
                                </p>
                                <h2 className="text-5xl text-white font-light uppercase italic">
                                    Strategic{" "}
                                    <span className="not-italic text-zinc-600">
                                        Checklist
                                    </span>
                                </h2>
                            </div>
                            <p className="text-xl text-zinc-200 leading-relaxed font-light">
                                Follow these protocols in the first 5 minutes of
                                your preparation to ensure a robust structural
                                case.
                            </p>
                            <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.02)]">
                                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] uppercase tracking-[0.4em] text-white font-black">
                                    Recommended Workflow
                                </span>
                            </div>
                        </div>

                        <div className="space-y-10 relative z-10">
                            {[
                                {
                                    label: "Define the Burden",
                                    detail: "What exactly do we need to prove to win this specific round? What is the 'Tie-breaker' logic?",
                                },
                                {
                                    label: "Actor Mapping",
                                    detail: "Identify primary and secondary actors involved. Assess their power and incentives.",
                                },
                                {
                                    label: "Comparative Analysis",
                                    detail: "What does the world look like on both sides? Be honest about the tradeoffs.",
                                },
                                {
                                    label: "Characterization",
                                    detail: "Set the environment. How do people feel? What are the pressures?",
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="flex gap-8 items-start group"
                                >
                                    <div className="text-[12px] font-mono text-zinc-600 group-hover:text-white transition-colors mt-2 font-bold">
                                        {String(i + 1).padStart(2, "0")}
                                    </div>
                                    <div className="space-y-3 text-left">
                                        <p className="text-xl text-white uppercase tracking-[0.2em] font-bold italic group-hover:pl-2 transition-all">
                                            {item.label}
                                        </p>
                                        <p className="text-lg text-zinc-400 group-hover:text-zinc-200 transition-colors leading-relaxed">
                                            {item.detail}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FOOTER CALL TO ACTION */}
                    <section className="pt-20 pb-40 text-center relative">
                        <div className="absolute inset-0 flex items-center justify-center -z-10">
                            <div className="w-[1000px] h-[500px] bg-white/[0.03] blur-[150px] rounded-full" />
                        </div>

                        <div className="max-w-2xl mx-auto space-y-16">
                            <div className="space-y-8">
                                <h2 className="text-4xl md:text-7xl font-light text-white uppercase tracking-widest leading-tight italic">
                                    Master the{" "}
                                    <span className="not-italic text-zinc-500">
                                        Microphone
                                    </span>
                                </h2>
                                <p className="text-sm text-zinc-400 leading-relaxed uppercase tracking-[0.8em] font-medium opacity-50">
                                    "Logic is the beginning of wisdom, not the
                                    end."
                                </p>
                            </div>

                            <div className="flex flex-col items-center gap-12">
                                <motion.div
                                    initial={{width: 0}}
                                    whileInView={{width: "200px"}}
                                    className="h-[2px] bg-white"
                                />
                                <motion.a
                                    href="/"
                                    whileHover={{y: -5, color: "#fff"}}
                                    className="group flex flex-col items-center gap-6 text-[12px] text-zinc-500 uppercase tracking-[0.8em] transition-all font-black"
                                >
                                    Return to Station
                                    <div className="w-2 h-2 bg-zinc-800 rounded-full group-hover:scale-[3] group-hover:bg-white transition-all duration-700" />
                                </motion.a>
                            </div>
                        </div>
                    </section>
                </section>
            </main>

            <footer className="py-12 border-t border-white/10 flex flex-col items-center gap-6 relative z-10 bg-[#020202]">
                <div className="flex items-center gap-4 opacity-40">
                    <Sparkles size={16} />
                    <span className="text-[10px] uppercase tracking-[1em] font-black">
                        SMVIT DEBSOC // SYSTEM v2.4
                    </span>
                </div>
            </footer>

            <style jsx global>{`
                @import url("https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap");

                body {
                    font-family: "Inter", sans-serif;
                }

                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
