"use client";

import React, {useEffect, useRef, useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import toast, {Toaster} from "react-hot-toast";
import {Clock3, Sparkles, ShieldAlert, Timer, Gauge, ChevronDown} from "lucide-react";

type ClockType = "" | "Timer" | "Stopwatch";

const TIMER_START_MS = 7 * 60 * 1000 + 15 * 1000; // 7:15

function formatClock(ms: number) {
    const minutes = Math.floor(ms / 60000)
        .toString()
        .padStart(2, "0");
    const seconds = Math.floor((ms % 60000) / 1000)
        .toString()
        .padStart(2, "0");
    const msDigits = Math.floor((ms % 1000) / 10)
        .toString()
        .padStart(2, "0");

    return `${minutes}:${seconds}:${msDigits}`;
}


function CustomDropdown({
    label,
    value,
    options,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (val: string) => void;
    placeholder: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative space-y-2" ref={dropdownRef}>
            <label className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-zinc-400">
                {label}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3.5 text-white backdrop-blur-md transition-all hover:bg-white/5 active:scale-[0.98] outline-none group ${
                    isOpen ? "ring-2 ring-white/20 border-white/20" : ""
                }`}
            >
                <span
                    className={`text-sm sm:text-base font-medium transition-colors ${
                        value ? "text-white" : "text-zinc-500"
                    }`}
                >
                    {value || placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-zinc-500 transition-transform duration-300 group-hover:text-zinc-300 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{opacity: 0, y: 10, scale: 0.95}}
                        animate={{opacity: 1, y: 0, scale: 1}}
                        exit={{opacity: 0, y: 10, scale: 0.95}}
                        transition={{duration: 0.2, ease: "easeOut"}}
                        className="absolute z-50 w-full mt-2 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        <div className="py-1">
                            {options.map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm sm:text-base transition-all hover:bg-white/10 ${
                                        value === opt
                                            ? "text-emerald-400 bg-white/5"
                                            : "text-zinc-300"
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function DebateTimerPanel() {
    const [debateStyle, setDebateStyle] = useState("");
    const [clockType, setClockType] = useState<ClockType>("");
    const [running, setRunning] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [timeMs, setTimeMs] = useState(TIMER_START_MS);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        setRunning(false);
        setHasStarted(false);
        setTimeMs(clockType === "Timer" ? TIMER_START_MS : 0);
    }, [clockType]);

    useEffect(() => {
        if (!running || !clockType) {
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeMs((prev) => {
                if (clockType === "Timer") {
                    const next = prev - 10;
                    if (next <= 0) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                        }
                        setRunning(false);
                        toast.error("Time stopped");
                        return 0;
                    }
                    return next;
                }

                return prev + 10;
            });
        }, 10);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [running, clockType]);

    const handleStart = () => {
        if (!clockType) return;
        setRunning(true);
        setHasStarted(true);
        toast.success("Time started!");
    };

    const handleStop = () => {
        if (!clockType) return;
        setRunning(false);
        toast.error("Time stopped");
    };

    const handleReset = () => {
        if (!clockType) return;
        setRunning(false);
        setHasStarted(false);
        setTimeMs(clockType === "Timer" ? TIMER_START_MS : 0);
        toast("Timer reset!", {
            icon: "🔄",
            style: {
                background: "#1f2937",
                color: "#f59e0b",
                border: "1px solid #f59e0b",
            },
        });
    };

    const getPOIMessage = () => {
        if (!clockType) return "";

        if (clockType === "Timer") {
            const secondsLeft = Math.ceil(timeMs / 1000);
            if (secondsLeft > 375 || secondsLeft <= 75) {
                return "Protected Time - Can't Ask POI";
            }
            return "Ask Speaker POI Preference";
        }

        const elapsedSeconds = Math.floor(timeMs / 1000);
        if (elapsedSeconds < 60 || elapsedSeconds >= 360) {
            return "Protected Time - Can't Ask POI";
        }
        return "Ask Speaker POI Preference";
    };

    const seconds = Math.floor(timeMs / 1000);
    const isProtected =
        !clockType ||
        (clockType === "Timer"
            ? seconds > 375 || seconds <= 75
            : seconds < 60 || seconds >= 360);

    const controlButtonBase =
        "px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-3 rounded-xl font-semibold text-sm sm:text-base tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed";

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            <div className="w-full max-w-6xl mx-auto rounded-2xl sm:rounded-3xl border border-white/10 bg-black/25 backdrop-blur-2xl p-3 sm:p-5 md:p-8 lg:p-10 text-white shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
                <div className="grid gap-4 sm:gap-6 md:grid-cols-[minmax(260px,360px)_minmax(0,1fr)] lg:grid-cols-[400px_minmax(0,1fr)]">
                    <motion.aside
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        transition={{duration: 0.55}}
                        className="rounded-xl sm:rounded-2xl border border-white/10 bg-zinc-950/70 p-4 sm:p-6 md:p-7 space-y-4 sm:space-y-6"
                    >
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-[0.2em] text-zinc-300">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                                Debate Timer Engine
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
                                Precision Panel
                            </h1>
                            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                                Parliamentary-ready timer with live centisecond
                                precision and POI protection guidance.
                            </p>
                        </div>

                        <AnimatePresence initial={false}>
                            {(!isMobile || !hasStarted) && (
                                <motion.div
                                    initial={{opacity: 0, height: 0}}
                                    animate={{opacity: 1, height: "auto"}}
                                    exit={{opacity: 0, height: 0}}
                                    transition={{
                                        duration: 0.4,
                                        ease: [0.33, 1, 0.68, 1],
                                    }}
                                    className="space-y-4 sm:space-y-6 overflow-hidden"
                                >
                                    <div className="grid gap-5">
                                        <CustomDropdown
                                            label="Debate Style"
                                            value={debateStyle}
                                            options={["Asian", "British"]}
                                            onChange={setDebateStyle}
                                            placeholder="Choose here"
                                        />

                                        <CustomDropdown
                                            label="Clock Type"
                                            value={clockType}
                                            options={["Stopwatch", "Timer"]}
                                            onChange={(val) =>
                                                setClockType(val as ClockType)
                                            }
                                            placeholder="Choose here"
                                        />
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                                            Current Setup
                                        </p>
                                        <p className="text-zinc-100 font-medium">
                                            {debateStyle
                                                ? `${debateStyle} parliamentary debate`
                                                : "Select a debate style"}
                                        </p>
                                        <p className="text-zinc-400 text-sm">
                                            {clockType ||
                                                "Clock type not selected"}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <button
                                onClick={handleStart}
                                disabled={!clockType}
                                className={`${controlButtonBase} bg-emerald-500 text-black hover:bg-emerald-400 hover:-translate-y-0.5`}
                            >
                                Start
                            </button>
                            <button
                                onClick={handleStop}
                                disabled={!clockType}
                                className={`${controlButtonBase} bg-rose-500 text-black hover:bg-rose-400 hover:-translate-y-0.5`}
                            >
                                Stop
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={!clockType}
                                className={`${controlButtonBase} bg-amber-400 text-black hover:bg-amber-300 hover:-translate-y-0.5`}
                            >
                                Reset
                            </button>
                        </div>
                    </motion.aside>

                    <motion.section
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6, delay: 0.08}}
                        className="rounded-xl sm:rounded-2xl border border-white/10 bg-zinc-950/60 p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-between gap-4 sm:gap-6 md:gap-8"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2 text-zinc-300">
                                <Clock3 className="w-4 h-4" />
                                <span className="text-xs uppercase tracking-[0.2em]">
                                    Live Time Feed
                                </span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-zinc-300">
                                <motion.span
                                    animate={{
                                        scale: running ? [1, 1.25, 1] : 1,
                                    }}
                                    transition={{
                                        duration: 0.9,
                                        repeat: running
                                            ? Number.POSITIVE_INFINITY
                                            : 0,
                                        ease: "easeInOut",
                                    }}
                                    className={`w-2 h-2 rounded-full ${
                                        running
                                            ? "bg-emerald-400"
                                            : "bg-zinc-600"
                                    }`}
                                />
                                {running ? "Running" : "Idle"}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center rounded-xl sm:rounded-3xl border border-white/5 bg-black/40 p-6 sm:p-10 md:p-12 lg:p-16 text-center min-h-[300px] sm:min-h-[400px]">
                            <motion.div
                                key={
                                    clockType === "Timer" && timeMs === 0
                                        ? "up"
                                        : "clock"
                                }
                                initial={{opacity: 0, scale: 0.9}}
                                animate={{opacity: 1, scale: 1}}
                                transition={{duration: 0.4, ease: "easeOut"}}
                                className="font-mono text-5xl sm:text-7xl md:text-8xl lg:text-8xl font-light tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                            >
                                {clockType === "Timer" && timeMs === 0
                                    ? "Time's Up!"
                                    : formatClock(timeMs)}
                            </motion.div>
                            <p className="mt-6 sm:mt-10 text-[10px] sm:text-xs uppercase tracking-[0.3em] font-medium text-zinc-500 opacity-60">
                                Minutes : Seconds : Milliseconds
                            </p>
                        </div>

                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center gap-2 mb-2 text-zinc-300">
                                    <ShieldAlert className="w-4 h-4" />
                                    <p className="text-xs uppercase tracking-[0.2em]">
                                        POI Window
                                    </p>
                                </div>
                                <p
                                    className={`text-xs sm:text-sm md:text-base font-medium ${
                                        isProtected
                                            ? "text-amber-300"
                                            : "text-emerald-300"
                                    }`}
                                >
                                    {clockType
                                        ? getPOIMessage()
                                        : "Select clock type to begin"}
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-1">
                                        Mode
                                    </p>
                                    <p className="text-zinc-100 font-medium inline-flex items-center gap-2">
                                        {clockType === "Timer" ? (
                                            <Timer className="w-4 h-4 text-amber-300" />
                                        ) : (
                                            <Gauge className="w-4 h-4 text-indigo-300" />
                                        )}
                                        {clockType || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-1">
                                        Debate
                                    </p>
                                    <p className="text-zinc-100 font-medium">
                                        {debateStyle || "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </div>

            {mounted && (
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: "#1f2937",
                            color: "#fff",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "500",
                        },
                        success: {
                            style: {
                                background: "#1f2937",
                                color: "#10b981",
                                border: "1px solid #10b981",
                            },
                            iconTheme: {
                                primary: "#10b981",
                                secondary: "#1f2937",
                            },
                        },
                        error: {
                            style: {
                                background: "#1f2937",
                                color: "#ef4444",
                                border: "1px solid #ef4444",
                            },
                            iconTheme: {
                                primary: "#ef4444",
                                secondary: "#1f2937",
                            },
                        },
                    }}
                />
            )}
        </>
    );
}
