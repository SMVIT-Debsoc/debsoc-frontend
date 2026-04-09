"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import DebateTimerPanel from "@/components/DebateTimerPanel";
import {ElegantShape} from "@/components/ui/shape-landing-hero";

export default function DebateTimerPage() {
    const [navHeight, setNavHeight] = React.useState(100);

    React.useEffect(() => {
        const updateNavHeight = () => {
            const nav = document.querySelector("nav");
            if (nav) {
                setNavHeight(nav.offsetHeight);
            }
        };

        updateNavHeight();
        window.addEventListener("resize", updateNavHeight);
        return () => window.removeEventListener("resize", updateNavHeight);
    }, []);

    return (
        <div className="relative min-h-screen bg-[#030303] text-white overflow-x-hidden selection:bg-indigo-500/30">
            <Navbar />
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-rose-500/5 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

            <main
                className="relative z-10 min-h-screen px-2 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-10"
                style={{paddingTop: `${navHeight + 16}px`}}
            >
                <div className="mx-auto w-full max-w-7xl h-full flex items-stretch">
                    <DebateTimerPanel />
                </div>
            </main>
        </div>
    );
}
