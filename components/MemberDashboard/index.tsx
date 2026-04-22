"use client";

import React, {useState, useEffect, useRef} from "react";
import styles from "./index.module.css";
import {motion, AnimatePresence, Variants} from "framer-motion";
import {
    LayoutDashboard,
    Calendar,
    CheckSquare,
    MessageSquare,
    MessageSquarePlus,
    LogOut,
    Trophy,
    CalendarDays,
    CheckCircle2,
    XCircle,
    Percent,
    Check,
    Send,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    RefreshCw,
    Inbox,
    Menu,
} from "lucide-react";
import Image from "next/image";
import {useSession, signOut} from "next-auth/react";

// Types
type AttendanceRecord = {
    id: string;
    status: "Present" | "Absent" | "Excused";
    speakerScore?: number | null;
    session: {
        id: string;
        sessionDate: string;
        motiontype: string;
        Chair: string;
    };
};
type Task = {
    id: string;
    name: string;
    description?: string;
    deadline: string;
    completed?: boolean;
};
type Feedback = {
    id: string;
    feedback: string;
    senderType: string;
    createdAt: string;
};
type President = {id: string; name: string; email: string};
type LeaderboardEntry = {
    id: string;
    name: string;
    type: "Member" | "Cabinet";
    score: number;
    sessions: number;
    rank: number;
};
type LeaderboardScope = "overall" | "bi-monthly";

// Helpers
const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return {
        month: d.toLocaleString("en-US", {month: "short"}).toUpperCase(),
        day: d.getDate(),
    };
};
const timeAgo = (iso: string, now: number) => {
    const h = Math.floor((now - new Date(iso).getTime()) / 3_600_000);
    if (h < 1) return "Just now";
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return d === 1 ? "Yesterday" : `${d}d ago`;
};
const fmtDeadline = (dl: string) =>
    new Date(dl).toLocaleDateString("en-US", {month: "short", day: "numeric"});
const isOverdue = (dl: string) =>
    !new Date(dl).valueOf() || new Date(dl) < new Date();

// Animation variants
const fadeUp: Variants = {
    hidden: {opacity: 0, y: 16},
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            delay: i * 0.07,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    }),
    exit: {opacity: 0, y: -8, transition: {duration: 0.2}},
};
const scaleIn: Variants = {
    hidden: {scale: 0.96, opacity: 0},
    visible: {
        scale: 1,
        opacity: 1,
        transition: {duration: 0.25, ease: "easeOut"},
    },
    exit: {scale: 0.96, opacity: 0, transition: {duration: 0.15}},
};

// Custom Dropdown
function CustomSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
}: {
    options: {id: string; label: string}[];
    value: string;
    onChange: (id: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find((o) => o.id === value);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} style={{position: "relative", userSelect: "none"}}>
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 16px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    fontSize: 14,
                    color: selected ? "#1e293b" : "#94a3b8",
                    cursor: "pointer",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: open
                        ? "0 0 0 3px rgba(99,102,241,0.15)"
                        : "none",
                    borderColor: open ? "#6366f1" : "#e2e8f0",
                }}
            >
                <span>{selected ? selected.label : placeholder}</span>
                <motion.span
                    animate={{rotate: open ? 180 : 0}}
                    transition={{duration: 0.2}}
                >
                    <ChevronDown size={16} color="#94a3b8" />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            left: 0,
                            right: 0,
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 12,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                            zIndex: 50,
                            overflow: "hidden",
                            transformOrigin: "top center",
                        }}
                    >
                        {options.length === 0 ? (
                            <div
                                style={{
                                    padding: "12px 16px",
                                    fontSize: 14,
                                    color: "#94a3b8",
                                    textAlign: "center",
                                }}
                            >
                                No options available
                            </div>
                        ) : (
                            options.map((opt, i) => (
                                <motion.button
                                    key={opt.id}
                                    type="button"
                                    initial={{opacity: 0, x: -4}}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        transition: {delay: i * 0.04},
                                    }}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setOpen(false);
                                    }}
                                    style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "11px 16px",
                                        fontSize: 14,
                                        cursor: "pointer",
                                        border: "none",
                                        borderBottom:
                                            i < options.length - 1
                                                ? "1px solid #f1f5f9"
                                                : "none",
                                        background:
                                            value === opt.id
                                                ? "#f0f4ff"
                                                : "#ffffff",
                                        color:
                                            value === opt.id
                                                ? "#4f46e5"
                                                : "#1e293b",
                                        fontWeight:
                                            value === opt.id ? 600 : 400,
                                        transition: "background 0.15s",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                    whileHover={{backgroundColor: "#f8fafc"}}
                                >
                                    {value === opt.id && (
                                        <Check size={14} color="#4f46e5" />
                                    )}
                                    {opt.label}
                                </motion.button>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Stat Card
function StatCard({
    icon: Icon,
    iconClass,
    label,
    value,
    sub,
    subClass,
    progress,
    index,
}: {
    icon: React.ElementType;
    iconClass: string;
    label: string;
    value: string | number;
    sub: string;
    subClass?: string;
    progress?: number;
    index: number;
}) {
    return (
        <motion.div
            variants={fadeUp}
            custom={index}
            className={styles.statCard}
            whileHover={{y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.08)"}}
            transition={{duration: 0.2}}
        >
            <div className={styles.statCardHeader}>
                <div className={`${styles.statIcon} ${iconClass}`}>
                    <Icon size={18} />
                </div>
                <span className={styles.statLabel}>{label}</span>
            </div>
            <div className={styles.statValueContainer}>
                <motion.span
                    className={styles.statValue}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.3 + index * 0.07}}
                >
                    {value}
                </motion.span>
                <span className={subClass || styles.statSubtext}>{sub}</span>
            </div>
            {progress !== undefined && (
                <div className={styles.progressBarContainer}>
                    <motion.div
                        className={styles.progressBarFill}
                        initial={{width: 0}}
                        animate={{width: `${progress}%`}}
                        transition={{
                            duration: 1,
                            delay: 0.5 + index * 0.07,
                            ease: "easeOut",
                        }}
                    />
                </div>
            )}
        </motion.div>
    );
}

// Main Component
export default function MemberDashboard() {
    const {data: session} = useSession();
    const [activeTab, setActiveTab] = useState("Dashboard");

    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [presidents, setPresidents] = useState<President[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [leaderboardScope, setLeaderboardScope] =
        useState<LeaderboardScope>("overall");
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [leaderboardError, setLeaderboardError] = useState<string | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [partialError, setPartialError] = useState<string | null>(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedPresidentId, setSelectedPresidentId] = useState("");
    const [messageText, setMessageText] = useState("");
    const [sending, setSending] = useState(false);
    const [messageSent, setMessageSent] = useState(false);
    const [messageError, setMessageError] = useState<string | null>(null);
    const [updatingTaskIds, setUpdatingTaskIds] = useState<string[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const [clientNow, setClientNow] = useState<number | null>(null);

    const userName = session?.user?.name || "Member";
    const firstName = userName.split(" ")[0];
    const userImage =
        session?.user?.image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=e2e8f0&color=475569`;
    const userRole = (session?.user as {role?: string})?.role || "Member";

    async function loadAll() {
        setLoading(true);
        setError(null);
        setPartialError(null);
        try {
            const [attRes, taskRes, fbRes, presRes] = await Promise.all([
                fetch("/api/member/attendance"),
                fetch("/api/member/tasks"),
                fetch("/api/member/feedback"),
                fetch("/api/member/presidents"),
            ]);

            const readMessage = async (response: Response, fallback: string) => {
                try {
                    const data = await response.json();
                    if (data && typeof data.message === "string" && data.message.trim())
                        return data.message;
                } catch {}
                return fallback;
            };

            const errors: string[] = [];

            if (attRes.ok) {
                const attData = await attRes.json();
                setAttendance(attData.attendance ?? []);
            } else {
                setAttendance([]);
                errors.push(await readMessage(attRes, "Attendance failed"));
            }

            if (taskRes.ok) {
                const taskData = await taskRes.json();
                setTasks(taskData.tasks ?? []);
            } else {
                setTasks([]);
                errors.push(await readMessage(taskRes, "Tasks failed"));
            }

            if (fbRes.ok) {
                const fbData = await fbRes.json();
                setFeedbacks(fbData.feedbacks ?? []);
            } else {
                setFeedbacks([]);
                errors.push(await readMessage(fbRes, "Feedback failed"));
            }

            if (presRes.ok) {
                const presData = await presRes.json();
                const nextPresidents = presData.presidents ?? [];
                setPresidents(nextPresidents);
                if (nextPresidents.length) {
                    setSelectedPresidentId((current) =>
                        current || nextPresidents[0].id,
                    );
                }
            } else {
                setPresidents([]);
                errors.push(await readMessage(presRes, "President list failed"));
            }

            if (errors.length) {
                setPartialError(
                    `Some data could not be loaded: ${errors.join(" | ")}`,
                );
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    async function loadLeaderboard(scope: LeaderboardScope) {
        setLeaderboardLoading(true);
        setLeaderboardError(null);
        try {
            const response = await fetch(
                `/api/leaderboard${scope === "bi-monthly" ? "?type=bi-monthly" : ""}`,
            );
            if (!response.ok) throw new Error("Failed to load leaderboard");
            const data = await response.json();
            setLeaderboard(data.leaderboard ?? []);
        } catch (e: unknown) {
            setLeaderboard([]);
            setLeaderboardError(
                e instanceof Error ? e.message : "Failed to load leaderboard",
            );
        } finally {
            setLeaderboardLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
    }, []);

    useEffect(() => {
        loadLeaderboard(leaderboardScope);
    }, [leaderboardScope]);

    useEffect(() => {
        const updateIsMobile = () => setIsMobile(window.innerWidth < 768);
        updateIsMobile();
        window.addEventListener("resize", updateIsMobile);
        return () => window.removeEventListener("resize", updateIsMobile);
    }, []);

    useEffect(() => {
        setClientNow(Date.now());
    }, []);

    const total = attendance.length;
    const present = attendance.filter((a) => a.status === "Present").length;
    const absent = attendance.filter((a) => a.status === "Absent").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    const rateLabel =
        rate >= 90
            ? "Excellent"
            : rate >= 75
              ? "Good"
              : rate >= 60
                ? "Average"
                : "Needs Work";

    const recentSessions = [...attendance]
        .sort(
            (a, b) =>
                new Date(b.session.sessionDate).getTime() -
                new Date(a.session.sessionDate).getTime(),
        )
        .slice(0, 5);

    const pendingTasks = tasks.filter((t) => !t.completed);
    const topLeaderboard = leaderboard.slice(0, 10);
    const currentUserRank = leaderboard.find(
        (entry) => entry.id === session?.user?.id && entry.type === "Member",
    );
    const topScore = leaderboard[0]?.score ?? 0;

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!messageText.trim() || !selectedPresidentId) return;
        setSending(true);
        setMessageError(null);
        try {
            const res = await fetch("/api/member/messages/president", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    message: messageText.trim(),
                    presidentId: selectedPresidentId,
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.message || "Failed to send");
            }
            setMessageText("");
            setMessageSent(true);
            setTimeout(() => setMessageSent(false), 4000);
        } catch (e: unknown) {
            setMessageError(e instanceof Error ? e.message : "Send failed");
        } finally {
            setSending(false);
        }
    }

    async function handleTaskToggle(taskId: string, completed: boolean) {
        const previousTasks = tasks;
        setUpdatingTaskIds((current) => [...current, taskId]);
        setTasks((current) =>
            current.map((task) =>
                task.id === taskId ? {...task, completed} : task,
            ),
        );

        try {
            const response = await fetch("/api/member/tasks", {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({taskId, completed}),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || "Failed to update task");
            }
        } catch (e) {
            setTasks(previousTasks);
            setError(e instanceof Error ? e.message : "Failed to update task");
        } finally {
            setUpdatingTaskIds((current) =>
                current.filter((id) => id !== taskId),
            );
        }
    }

    const navItems = [
        {label: "Dashboard", icon: LayoutDashboard},
        {label: "Sessions", icon: Calendar},
        {label: "Tasks", icon: CheckSquare, count: pendingTasks.length},
        {label: "Leaderboard", icon: Trophy},
        {label: "Feedback", icon: MessageSquare},
        {label: "Suggestions", icon: MessageSquarePlus},
    ];

    return (
        <div className={styles.container}>
            {/* SIDEBAR OVERLAY */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className={styles.overlay}
                        onClick={() => setIsSidebarOpen(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            backgroundColor: "rgba(0,0,0,0.4)",
                            zIndex: 90,
                            backdropFilter: "blur(4px)",
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={styles.sidebar}
                initial={false}
                animate={{
                    x: isMobile ? (isSidebarOpen ? 0 : -280) : 0,
                    opacity: 1,
                }}
                transition={{type: "spring", damping: 25, stiffness: 200}}
            >
                {/* Logo */}
                <div className={styles.logoArea}>
                    <div style={{width: 32, height: 32, flexShrink: 0}}>
                        <Image
                            src="/logo.png"
                            alt="Debsoc"
                            width={32}
                            height={32}
                            style={{
                                objectFit: "contain",
                                width: "100%",
                                height: "100%",
                            }}
                        />
                    </div>
                    <span
                        style={{
                            letterSpacing: "0.1em",
                            fontWeight: 700,
                            fontSize: 17,
                        }}
                    >
                        DEBSOC
                    </span>
                    <button
                        className={styles.closeSidebar}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Nav */}
                <nav className={styles.nav}>
                    {navItems.map(({label, icon: Icon, count}, i) => (
                        <motion.a
                            key={label}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveTab(label);
                                setIsSidebarOpen(false);
                            }}
                            className={`${styles.navItem} ${activeTab === label ? styles.active : ""}`}
                            initial={{opacity: 0, x: -12}}
                            animate={{opacity: 1, x: 0}}
                            transition={{delay: 0.05 + i * 0.06}}
                            whileHover={{x: 3}}
                            whileTap={{scale: 0.97}}
                        >
                            <Icon className={styles.navItemIcon} size={18} />
                            <span>{label}</span>
                            {count != null && count > 0 && (
                                <motion.span
                                    className={`${styles.badge} ${styles.badgeOrange}`}
                                    initial={{scale: 0}}
                                    animate={{scale: 1}}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 20,
                                    }}
                                >
                                    {count}
                                </motion.span>
                            )}
                        </motion.a>
                    ))}
                </nav>

                {/* Profile */}
                <motion.div
                    className={styles.profileArea}
                    initial={{opacity: 0, y: 10}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.4}}
                >
                    <img
                        src={userImage}
                        alt={userName}
                        className={styles.profileImg}
                    />
                    <div className={styles.profileInfo}>
                        <span className={styles.profileName}>{userName}</span>
                        <span className={styles.profileRole}>{userRole}</span>
                    </div>
                    <motion.button
                        className={styles.logoutBtn}
                        title="Log out"
                        onClick={() => signOut({callbackUrl: "/login"})}
                        whileHover={{scale: 1.1, color: "#ef4444"}}
                        whileTap={{scale: 0.9}}
                    >
                        <LogOut size={18} />
                    </motion.button>
                </motion.div>
            </motion.aside>

            {/* Main */}
            <main className={styles.main}>
                {/* MOBILE TOP BAR */}
                <div
                    className={styles.mobileTopBar}
                    style={{
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 20,
                        padding: "0 4px",
                    }}
                >
                    <button
                        className={styles.hamburger}
                        onClick={() => setIsSidebarOpen(true)}
                        style={{
                            background: "#ffffff",
                            border: "1px solid #eaeaea",
                            borderRadius: 8,
                            padding: 8,
                            cursor: "pointer",
                            color: "#1e293b",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                    >
                        <Menu size={20} />
                    </button>
                    <div style={{width: 28, height: 28}}>
                        <Image
                            src="/logo.png"
                            alt="Debsoc"
                            width={28}
                            height={28}
                            style={{objectFit: "contain"}}
                        />
                    </div>
                    <div style={{width: 40}}></div> {/* Spacer */}
                </div>

                {/* Loading */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            key="loading"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "60vh",
                                gap: 14,
                                color: "#64748b",
                            }}
                        >
                            <motion.div
                                animate={{rotate: 360}}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                            >
                                <Loader2 size={32} color="#6366f1" />
                            </motion.div>
                            <span style={{fontSize: 15}}>
                                Loading your dashboard...
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                    {error && !loading && (
                        <motion.div
                            key="error"
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{
                                padding: 24,
                                background: "#fef2f2",
                                borderRadius: 16,
                                color: "#e11d48",
                                border: "1px solid #fecdd3",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                maxWidth: 500,
                                margin: "40px auto",
                            }}
                        >
                            <AlertCircle size={20} />
                            <div style={{flex: 1}}>
                                <strong>Error:</strong> {error}
                            </div>
                            <motion.button
                                onClick={loadAll}
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 14px",
                                    borderRadius: 8,
                                    background: "#e11d48",
                                    color: "white",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                }}
                            >
                                <RefreshCw size={14} /> Retry
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Dashboard content */}
                <AnimatePresence mode="wait">
                    {!loading && !error && partialError && (
                        <motion.div
                            key="partial-error"
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{
                                padding: 16,
                                background: "#fef2f2",
                                borderRadius: 12,
                                color: "#e11d48",
                                border: "1px solid #fecdd3",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                maxWidth: 560,
                                margin: "0 auto 20px auto",
                            }}
                        >
                            <AlertCircle size={18} />
                            <div style={{flex: 1, minWidth: 0}}>
                                <strong>Error:</strong> {partialError}
                            </div>
                            <motion.button
                                onClick={loadAll}
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 14px",
                                    borderRadius: 8,
                                    background: "#e11d48",
                                    color: "white",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                }}
                            >
                                <RefreshCw size={14} /> Retry
                            </motion.button>
                        </motion.div>
                    )}
                    {!loading && !error && (activeTab === "Dashboard" || activeTab === "Sessions" || activeTab === "Tasks" || activeTab === "Suggestions" || activeTab === "Feedback") && (
                        <motion.div
                            key="dashboard"
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={{
                                hidden: {},
                                visible: {transition: {staggerChildren: 0.06}},
                            }}
                        >
                            {/* Header */}
                            {activeTab === "Dashboard" && (
                            <motion.header
                                variants={fadeUp}
                                className={styles.header}
                            >
                                <div>
                                    <h1 className={styles.greeting}>
                                        Welcome back, {firstName}!
                                    </h1>
                                    <p className={styles.subtitle}>
                                        Here's your attendance overview for this
                                        semester.
                                    </p>
                                </div>
                                {rate > 0 && (
                                    <motion.div
                                        className={styles.rankBadge}
                                        initial={{scale: 0.85, opacity: 0}}
                                        animate={{scale: 1, opacity: 1}}
                                        transition={{
                                            delay: 0.35,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20,
                                        }}
                                    >
                                        <span className={styles.rankLabel}>
                                            Attendance:
                                        </span>
                                        <Trophy size={15} />
                                        <span>
                                            {rate}% - {rateLabel}
                                        </span>
                                    </motion.div>
                                )}
                            </motion.header>
                            )}

                            {/* Stats */}
                            {activeTab === "Dashboard" && (
                            <motion.div
                                variants={fadeUp}
                                className={styles.statsGrid}
                            >
                                <StatCard
                                    index={0}
                                    icon={CalendarDays}
                                    iconClass={styles.statIconBlue}
                                    label="Total"
                                    value={total}
                                    sub="Sessions"
                                />
                                <StatCard
                                    index={1}
                                    icon={CheckCircle2}
                                    iconClass={styles.statIconGreen}
                                    label="Present"
                                    value={present}
                                    sub="Attended"
                                    subClass={styles.statSubtextGreen}
                                />
                                <StatCard
                                    index={2}
                                    icon={XCircle}
                                    iconClass={styles.statIconRed}
                                    label="Absent"
                                    value={absent}
                                    sub="Missed"
                                />
                                <StatCard
                                    index={3}
                                    icon={Percent}
                                    iconClass={styles.statIconOrange}
                                    label="Rate"
                                    value={`${rate}%`}
                                    sub={rateLabel}
                                    subClass={styles.statSubtextOrange}
                                    progress={rate}
                                />
                            </motion.div>
                            )}

                            {/* Content grid */}
                            <motion.div
                                variants={fadeUp}
                                className={styles.contentGrid}
                                style={{
                                    gridTemplateColumns:
                                        activeTab === "Dashboard"
                                            ? undefined
                                            : "1fr",
                                }}
                            >
                                {/* Left */}
                                {(activeTab === "Dashboard" ||
                                    activeTab === "Sessions" ||
                                    activeTab === "Tasks") && (
                                <div className={styles.columnLeft}>
                                    {/* Recent Sessions */}
                                    {(activeTab === "Dashboard" || activeTab === "Sessions") && (
                                    <motion.div
                                        className={styles.card}
                                        variants={fadeUp}
                                        custom={2}
                                    >
                                        <div className={styles.cardHeader}>
                                            <h2 className={styles.cardTitle}>
                                                Recent Sessions
                                            </h2>
                                        </div>
                                        <div className={styles.sessionList}>
                                            {recentSessions.length === 0 ? (
                                                <EmptyState
                                                    icon={CalendarDays}
                                                    text="No sessions recorded yet."
                                                />
                                            ) : (
                                                recentSessions.map((att, i) => {
                                                    const {month, day} =
                                                        fmtDate(
                                                            att.session
                                                                .sessionDate,
                                                        );
                                                    return (
                                                        <motion.div
                                                            key={att.id}
                                                            className={
                                                                styles.sessionItem
                                                            }
                                                            initial={{
                                                                opacity: 0,
                                                                x: -8,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                x: 0,
                                                            }}
                                                            transition={{
                                                                delay:
                                                                    0.1 +
                                                                    i * 0.07,
                                                            }}
                                                        >
                                                            <div
                                                                className={
                                                                    styles.sessionDate
                                                                }
                                                            >
                                                                <span
                                                                    className={
                                                                        styles.sessionMonth
                                                                    }
                                                                >
                                                                    {month}
                                                                </span>
                                                                <span
                                                                    className={
                                                                        styles.sessionDay
                                                                    }
                                                                >
                                                                    {day}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className={
                                                                    styles.sessionContent
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        styles.sessionHeader
                                                                    }
                                                                >
                                                                    <h3
                                                                        className={
                                                                            styles.sessionTitle
                                                                        }
                                                                    >
                                                                        {
                                                                            att
                                                                                .session
                                                                                .motiontype
                                                                        }
                                                                    </h3>
                                                                    <span
                                                                        className={`${styles.sessionStatus} ${att.status === "Present" ? styles.statusPresent : styles.statusAbsent}`}
                                                                    >
                                                                        {
                                                                            att.status
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <p
                                                                    className={
                                                                        styles.sessionDesc
                                                                    }
                                                                >
                                                                    Chair:{" "}
                                                                    {
                                                                        att
                                                                            .session
                                                                            .Chair
                                                                    }
                                                                </p>
                                                                {att.speakerScore !=
                                                                    null && (
                                                                    <div
                                                                        className={
                                                                            styles.sessionDetails
                                                                        }
                                                                    >
                                                                        <div
                                                                            className={
                                                                                styles.detailBoxOrange
                                                                            }
                                                                        >
                                                                            <div
                                                                                className={
                                                                                    styles.detailBoxLabel
                                                                                }
                                                                            >
                                                                                Speaker
                                                                                Score
                                                                            </div>
                                                                            <div
                                                                                className={
                                                                                    styles.detailBoxValueOrange
                                                                                }
                                                                            >
                                                                                {
                                                                                    att.speakerScore
                                                                                }
                                                                                /100
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </motion.div>
                                    )}

                                    {/* Tasks */}
                                    {(activeTab === "Dashboard" || activeTab === "Tasks") && (
                                    <motion.div
                                        className={styles.card}
                                        variants={fadeUp}
                                        custom={3}
                                    >
                                        <div className={styles.cardHeader}>
                                            <h2 className={styles.cardTitle}>
                                                My Tasks
                                            </h2>
                                            {pendingTasks.length > 0 && (
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        color: "#6366f1",
                                                        fontWeight: 600,
                                                        background: "#eef2ff",
                                                        padding: "3px 10px",
                                                        borderRadius: 20,
                                                    }}
                                                >
                                                    {pendingTasks.length}{" "}
                                                    pending
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.taskList}>
                                            {tasks.length === 0 ? (
                                                <EmptyState
                                                    icon={CheckSquare}
                                                    text="No tasks assigned yet."
                                                />
                                            ) : (
                                                tasks.map((task, i) => (
                                                    <motion.div
                                                        key={task.id}
                                                        className={
                                                            styles.taskItem
                                                        }
                                                        initial={{
                                                            opacity: 0,
                                                            x: -8,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            x: 0,
                                                        }}
                                                        transition={{
                                                            delay:
                                                                0.1 + i * 0.07,
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            className={`${styles.checkbox} ${task.completed ? styles.checkboxChecked : ""}`}
                                                            onClick={() =>
                                                                handleTaskToggle(
                                                                    task.id,
                                                                    !task.completed,
                                                                )
                                                            }
                                                            disabled={updatingTaskIds.includes(
                                                                task.id,
                                                            )}
                                                            aria-label={
                                                                task.completed
                                                                    ? `Mark ${task.name} incomplete`
                                                                    : `Mark ${task.name} complete`
                                                            }
                                                            aria-pressed={
                                                                task.completed
                                                            }
                                                        >
                                                            {updatingTaskIds.includes(
                                                                task.id,
                                                            ) ? (
                                                                <Loader2
                                                                    size={12}
                                                                    className="animate-spin"
                                                                />
                                                            ) : task.completed ? (
                                                                <Check
                                                                    size={12}
                                                                />
                                                            ) : null}
                                                        </button>
                                                        <div
                                                            className={
                                                                styles.taskContent
                                                            }
                                                        >
                                                            <h3
                                                                className={`${styles.taskTitle} ${task.completed ? styles.taskTitleCompleted : ""}`}
                                                            >
                                                                {task.name}
                                                            </h3>
                                                            {task.description && (
                                                                <p
                                                                    style={{
                                                                        fontSize: 13,
                                                                        color: "#64748b",
                                                                        marginBottom: 3,
                                                                    }}
                                                                >
                                                                    {
                                                                        task.description
                                                                    }
                                                                </p>
                                                            )}
                                                            <div
                                                                className={
                                                                    !task.completed &&
                                                                    isOverdue(
                                                                        task.deadline,
                                                                    )
                                                                        ? styles.taskMetaWarning
                                                                        : styles.taskMeta
                                                                }
                                                            >
                                                                Due{" "}
                                                                {fmtDeadline(
                                                                    task.deadline,
                                                                )}
                                                                {!task.completed &&
                                                                    isOverdue(
                                                                        task.deadline,
                                                                    ) &&
                                                                    " · Overdue"}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                    )}
                                </div>
                                )}

                                {/* Right */}
                                {(activeTab === "Dashboard" || activeTab === "Suggestions" || activeTab === "Feedback") && (
                                <div
                                    className={
                                        activeTab === "Dashboard"
                                            ? styles.columnRight
                                            : ""
                                    }
                                    style={
                                        activeTab !== "Dashboard"
                                            ? {
                                                  display: "flex",
                                                  flexDirection: "column",
                                                  gap: 24,
                                              }
                                            : {}
                                    }
                                >
                                    {/* Suggestion Box */}
                                    {(activeTab === "Dashboard" || activeTab === "Suggestions") && (
                                    <motion.div
                                        className={styles.card}
                                        variants={fadeUp}
                                        custom={4}
                                    >
                                        <div className={styles.cardHeader}>
                                            <h2
                                                className={styles.cardTitle}
                                                style={{
                                                    fontSize: 16,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: 8,
                                                        background: "#eef2ff",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    <Send
                                                        size={14}
                                                        color="#6366f1"
                                                    />
                                                </span>
                                                Suggestion Box
                                            </h2>
                                        </div>
                                        <p
                                            style={{
                                                fontSize: 13,
                                                color: "#64748b",
                                                marginBottom: 16,
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            Send an anonymous message to the
                                            leadership team regarding society
                                            affairs.
                                        </p>
                                        <form
                                            onSubmit={handleSend}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 12,
                                            }}
                                        >
                                            <CustomSelect
                                                options={presidents.map(
                                                    (p) => ({
                                                        id: p.id,
                                                        label: `To: ${p.name}`,
                                                    }),
                                                )}
                                                value={selectedPresidentId}
                                                onChange={
                                                    setSelectedPresidentId
                                                }
                                                placeholder="Select recipient..."
                                            />
                                            <textarea
                                                rows={4}
                                                placeholder="Type your suggestion here..."
                                                value={messageText}
                                                onChange={(e) =>
                                                    setMessageText(
                                                        e.target.value,
                                                    )
                                                }
                                                style={{
                                                    width: "100%",
                                                    padding: "11px 14px",
                                                    background: "#f8fafc",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: 10,
                                                    fontSize: 14,
                                                    color: "#1e293b",
                                                    resize: "none",
                                                    outline: "none",
                                                    fontFamily: "inherit",
                                                    transition:
                                                        "border-color 0.2s, box-shadow 0.2s",
                                                    lineHeight: 1.6,
                                                    boxSizing: "border-box",
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor =
                                                        "#6366f1";
                                                    e.currentTarget.style.boxShadow =
                                                        "0 0 0 3px rgba(99,102,241,0.12)";
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor =
                                                        "#e2e8f0";
                                                    e.currentTarget.style.boxShadow =
                                                        "none";
                                                }}
                                            />

                                            <AnimatePresence>
                                                {messageError && (
                                                    <motion.p
                                                        initial={{
                                                            opacity: 0,
                                                            y: -4,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            y: -4,
                                                        }}
                                                        style={{
                                                            fontSize: 13,
                                                            color: "#e11d48",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 6,
                                                        }}
                                                    >
                                                        <AlertCircle
                                                            size={13}
                                                        />{" "}
                                                        {messageError}
                                                    </motion.p>
                                                )}
                                                {messageSent && (
                                                    <motion.p
                                                        initial={{
                                                            opacity: 0,
                                                            y: -4,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            y: -4,
                                                        }}
                                                        style={{
                                                            fontSize: 13,
                                                            color: "#059669",
                                                            fontWeight: 600,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 6,
                                                        }}
                                                    >
                                                        <CheckCircle2
                                                            size={13}
                                                        />{" "}
                                                        Sent anonymously!
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>

                                            <motion.button
                                                type="submit"
                                                disabled={
                                                    sending ||
                                                    !messageText.trim() ||
                                                    !selectedPresidentId
                                                }
                                                whileHover={{scale: 1.02}}
                                                whileTap={{scale: 0.97}}
                                                style={{
                                                    padding: "11px 16px",
                                                    background:
                                                        sending ||
                                                        !messageText.trim()
                                                            ? "#e2e8f0"
                                                            : "#1e293b",
                                                    color:
                                                        sending ||
                                                        !messageText.trim()
                                                            ? "#94a3b8"
                                                            : "white",
                                                    border: "none",
                                                    borderRadius: 10,
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    cursor:
                                                        sending ||
                                                        !messageText.trim()
                                                            ? "not-allowed"
                                                            : "pointer",
                                                    transition:
                                                        "background 0.2s, color 0.2s",
                                                    fontFamily: "inherit",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                {sending ? (
                                                    <>
                                                        <motion.span
                                                            animate={{
                                                                rotate: 360,
                                                            }}
                                                            transition={{
                                                                duration: 1,
                                                                repeat: Infinity,
                                                                ease: "linear",
                                                            }}
                                                        >
                                                            <Loader2
                                                                size={14}
                                                            />
                                                        </motion.span>{" "}
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send size={14} /> Send
                                                        Anonymously
                                                    </>
                                                )}
                                            </motion.button>
                                        </form>
                                    </motion.div>
                                    )}

                                    {/* Feedback Inbox */}
                                    {(activeTab === "Dashboard" || activeTab === "Feedback") && (
                                    <motion.div
                                        className={styles.feedbackCard}
                                        variants={fadeUp}
                                        custom={5}
                                    >
                                        <div
                                            className={styles.cardHeader}
                                            style={{marginBottom: 16}}
                                        >
                                            <h2
                                                className={styles.cardTitle}
                                                style={{
                                                    fontSize: 16,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: 8,
                                                        background: "#f0fdf4",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    <Inbox
                                                        size={14}
                                                        color="#059669"
                                                    />
                                                </span>
                                                Feedback Inbox
                                            </h2>
                                            {feedbacks.length > 0 && (
                                                <motion.span
                                                    className={`${styles.badge} ${styles.badgeOrange}`}
                                                    style={{margin: 0}}
                                                    initial={{scale: 0}}
                                                    animate={{scale: 1}}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 400,
                                                    }}
                                                >
                                                    {feedbacks.length} New
                                                </motion.span>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 12,
                                                maxHeight: 300,
                                                overflowY: "auto",
                                                paddingRight: 2,
                                            }}
                                        >
                                            {feedbacks.length === 0 ? (
                                                <EmptyState
                                                    icon={Inbox}
                                                    text="No feedback yet."
                                                />
                                            ) : (
                                                feedbacks.map((fb, i) => (
                                                    <motion.div
                                                        key={fb.id}
                                                        className={
                                                            styles.feedbackItem
                                                        }
                                                        initial={{
                                                            opacity: 0,
                                                            y: 8,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        transition={{
                                                            delay:
                                                                0.1 + i * 0.07,
                                                        }}
                                                        style={
                                                            i <
                                                            feedbacks.length - 1
                                                                ? {
                                                                      borderBottom:
                                                                          "1px solid #f1f5f9",
                                                                      paddingBottom: 12,
                                                                  }
                                                                : {}
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.feedbackItemHeader
                                                            }
                                                        >
                                                            <span
                                                                className={`${styles.feedbackFrom} ${fb.senderType === "President" ? styles.feedbackFromPresident : styles.feedbackFromCabinet}`}
                                                            >
                                                                {fb.senderType}
                                                            </span>
                                                            <span
                                                                className={
                                                                    styles.feedbackTime
                                                                }
                                                            >
                                                                {clientNow
                                                                    ? timeAgo(
                                                                          fb.createdAt,
                                                                          clientNow,
                                                                      )
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                        <p
                                                            className={
                                                                styles.feedbackDesc
                                                            }
                                                        >
                                                            &ldquo;{fb.feedback}
                                                            &rdquo;
                                                        </p>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                    )}
                                </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}

                    {!loading && !error && activeTab === "Leaderboard" && (
                        <motion.div
                            key="leaderboard"
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={{
                                hidden: {},
                                visible: {transition: {staggerChildren: 0.06}},
                            }}
                        >
                            <motion.header
                                variants={fadeUp}
                                className={styles.header}
                            >
                                <div>
                                    <h1 className={styles.greeting}>
                                        Speaker Leaderboard
                                    </h1>
                                    <p className={styles.subtitle}>
                                        Rankings are based on total speaker
                                        scores from attended sessions.
                                    </p>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        padding: 4,
                                        borderRadius: 999,
                                        background: "#ffffff",
                                        border: "1px solid #eaeaea",
                                    }}
                                >
                                    {(
                                        [
                                            ["overall", "Overall"],
                                            ["bi-monthly", "Last 60 days"],
                                        ] as const
                                    ).map(([scope, label]) => (
                                        <button
                                            key={scope}
                                            type="button"
                                            onClick={() =>
                                                setLeaderboardScope(scope)
                                            }
                                            style={{
                                                border: "none",
                                                borderRadius: 999,
                                                padding: "8px 14px",
                                                fontSize: 13,
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                background:
                                                    leaderboardScope === scope
                                                        ? "#fff7ed"
                                                        : "transparent",
                                                color:
                                                    leaderboardScope === scope
                                                        ? "#ea580c"
                                                        : "#64748b",
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </motion.header>

                            <motion.div
                                variants={fadeUp}
                                className={styles.contentGrid}
                            >
                                <motion.div
                                    className={styles.card}
                                    variants={fadeUp}
                                    custom={1}
                                >
                                    <div className={styles.cardHeader}>
                                        <h2 className={styles.cardTitle}>
                                            Top Speakers
                                        </h2>
                                        <span
                                            className={`${styles.badge} ${styles.badgeOrange}`}
                                            style={{marginLeft: 0}}
                                        >
                                            {leaderboard.length} ranked
                                        </span>
                                    </div>

                                    {leaderboardLoading ? (
                                        <EmptyState
                                            icon={Loader2}
                                            text="Loading leaderboard..."
                                        />
                                    ) : leaderboardError ? (
                                        <motion.div
                                            initial={{opacity: 0}}
                                            animate={{opacity: 1}}
                                            style={{
                                                padding: 16,
                                                borderRadius: 12,
                                                border: "1px solid #fecdd3",
                                                background: "#fef2f2",
                                                color: "#e11d48",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                                fontSize: 14,
                                            }}
                                        >
                                            <AlertCircle size={16} />
                                            {leaderboardError}
                                        </motion.div>
                                    ) : topLeaderboard.length === 0 ? (
                                        <EmptyState
                                            icon={Trophy}
                                            text="No speaker scores recorded yet."
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 10,
                                            }}
                                        >
                                            {topLeaderboard.map((entry, i) => {
                                                const isCurrentUser =
                                                    entry.id ===
                                                        session?.user?.id &&
                                                    entry.type === "Member";
                                                const scorePct =
                                                    topScore > 0
                                                        ? Math.round(
                                                              (entry.score /
                                                                  topScore) *
                                                                  100,
                                                          )
                                                        : 0;

                                                return (
                                                    <motion.div
                                                        key={`${entry.type}-${entry.id}`}
                                                        initial={{
                                                            opacity: 0,
                                                            y: 8,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        transition={{
                                                            delay:
                                                                0.08 + i * 0.05,
                                                        }}
                                                        style={{
                                                            display: "grid",
                                                            gridTemplateColumns:
                                                                "48px 1fr auto",
                                                            alignItems: "center",
                                                            gap: 14,
                                                            padding: 14,
                                                            borderRadius: 14,
                                                            border: isCurrentUser
                                                                ? "1px solid #fed7aa"
                                                                : "1px solid #f1f5f9",
                                                            background:
                                                                entry.rank <= 3
                                                                    ? "#fff7ed"
                                                                    : isCurrentUser
                                                                      ? "#fffbeb"
                                                                      : "#ffffff",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius: 12,
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                fontWeight: 800,
                                                                color:
                                                                    entry.rank <=
                                                                    3
                                                                        ? "#ea580c"
                                                                        : "#475569",
                                                                background:
                                                                    entry.rank <=
                                                                    3
                                                                        ? "#ffedd5"
                                                                        : "#f8fafc",
                                                            }}
                                                        >
                                                            #{entry.rank}
                                                        </div>
                                                        <div
                                                            style={{
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 8,
                                                                    marginBottom: 6,
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        fontWeight: 800,
                                                                        color: "#1e293b",
                                                                        overflow:
                                                                            "hidden",
                                                                        textOverflow:
                                                                            "ellipsis",
                                                                        whiteSpace:
                                                                            "nowrap",
                                                                    }}
                                                                >
                                                                    {entry.name}
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        fontSize: 11,
                                                                        fontWeight: 700,
                                                                        color:
                                                                            entry.type ===
                                                                            "Cabinet"
                                                                                ? "#4f46e5"
                                                                                : "#059669",
                                                                        background:
                                                                            entry.type ===
                                                                            "Cabinet"
                                                                                ? "#eef2ff"
                                                                                : "#f0fdf4",
                                                                        padding:
                                                                            "2px 8px",
                                                                        borderRadius: 999,
                                                                    }}
                                                                >
                                                                    {entry.type}
                                                                </span>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    height: 6,
                                                                    borderRadius: 999,
                                                                    background:
                                                                        "#f1f5f9",
                                                                    overflow:
                                                                        "hidden",
                                                                }}
                                                            >
                                                                <motion.div
                                                                    initial={{
                                                                        width: 0,
                                                                    }}
                                                                    animate={{
                                                                        width: `${scorePct}%`,
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.6,
                                                                        delay:
                                                                            0.12 +
                                                                            i *
                                                                                0.04,
                                                                    }}
                                                                    style={{
                                                                        height: "100%",
                                                                        borderRadius: 999,
                                                                        background:
                                                                            "#ea580c",
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontWeight: 800,
                                                                    color: "#1e293b",
                                                                }}
                                                            >
                                                                {entry.score.toFixed(
                                                                    1,
                                                                )}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: "#94a3b8",
                                                                }}
                                                            >
                                                                {entry.sessions}{" "}
                                                                sessions
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>

                                <motion.div
                                    className={styles.feedbackCard}
                                    variants={fadeUp}
                                    custom={2}
                                >
                                    <div
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 16,
                                            background: "#fff7ed",
                                            color: "#ea580c",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginBottom: 16,
                                        }}
                                    >
                                        <Trophy size={24} />
                                    </div>
                                    <h2
                                        className={styles.cardTitle}
                                        style={{marginBottom: 8}}
                                    >
                                        Your Rank
                                    </h2>
                                    {currentUserRank ? (
                                        <>
                                            <div
                                                style={{
                                                    fontSize: 44,
                                                    lineHeight: 1,
                                                    fontWeight: 900,
                                                    color: "#1e293b",
                                                    marginBottom: 8,
                                                }}
                                            >
                                                #{currentUserRank.rank}
                                            </div>
                                            <p
                                                className={styles.subtitle}
                                                style={{marginBottom: 18}}
                                            >
                                                {currentUserRank.score.toFixed(
                                                    1,
                                                )}{" "}
                                                total speaker points across{" "}
                                                {currentUserRank.sessions}{" "}
                                                attended sessions.
                                            </p>
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                        "1fr 1fr",
                                                    gap: 10,
                                                }}
                                            >
                                                <div
                                                    className={
                                                        styles.detailBoxOrange
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.detailBoxLabel
                                                        }
                                                    >
                                                        Scope
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.detailBoxValueOrange
                                                        }
                                                    >
                                                        {leaderboardScope ===
                                                        "overall"
                                                            ? "Overall"
                                                            : "60 days"}
                                                    </div>
                                                </div>
                                                <div className={styles.detailBox}>
                                                    <div
                                                        className={
                                                            styles.detailBoxLabel
                                                        }
                                                    >
                                                        Field
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.detailBoxValue
                                                        }
                                                    >
                                                        {leaderboard.length}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <EmptyState
                                            icon={Trophy}
                                            text="Attend a scored session to enter the leaderboard."
                                        />
                                    )}
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Other tabs */}
                    {!loading &&
                        !error &&
                        activeTab !== "Dashboard" &&
                        activeTab !== "Leaderboard" &&
                        activeTab !== "Sessions" &&
                        activeTab !== "Tasks" &&
                        activeTab !== "Suggestions" &&
                        activeTab !== "Feedback" && (
                        <motion.div
                            key={activeTab}
                            variants={fadeUp}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: 300,
                                textAlign: "center",
                                gap: 12,
                                color: "#64748b",
                            }}
                        >
                            <h1
                                className={styles.greeting}
                                style={{color: "#1e293b", marginBottom: 4}}
                            >
                                {activeTab}
                            </h1>
                            <p className={styles.subtitle}>
                                This section is coming soon.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// Empty state helper
function EmptyState({
    icon: Icon,
    text,
}: {
    icon: React.ElementType;
    text: string;
}) {
    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "32px 0",
                color: "#94a3b8",
            }}
        >
            <Icon size={28} strokeWidth={1.5} />
            <span style={{fontSize: 14}}>{text}</span>
        </motion.div>
    );
}
