"use client";

import React, {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
    LayoutDashboard,
    Calendar,
    CheckSquare,
    BarChart2,
    Users,
    Bell,
    Plus,
    CheckCircle2,
    Medal,
    ListTodo,
    FileText,
    CalendarDays,
    User,
    MessageSquare,
    Send,
    LogOut,
    Gavel,
    Loader2,
    AlertCircle,
    RefreshCw,
    Clock,
    Menu,
} from "lucide-react";
import Image from "next/image";
import {useSession, signOut} from "next-auth/react";

// ── Types ──────────────────────────────────────────────────────────────────
type Member = {id: string; name: string; email: string};
type CabinetMember = {
    id: string;
    name: string;
    email: string;
    position: string;
};
type President = {id: string; name: string; email: string};
type AttendanceParticipant = {
    id: string;
    name: string;
    email: string;
    role: "Member" | "Cabinet";
};
type AttendanceFormRow = {
    status: string;
    score: string;
    pairingCode: string;
    debatedAlone: boolean;
};
type LeaderboardEntry = {
    id: string;
    name: string;
    type: "Member" | "Cabinet";
    score: number;
    sessions: number;
    rank: number;
};
type LeaderboardScope = "overall" | "bi-monthly";
type AttendanceRecord = {
    id: string;
    status: "Present" | "Absent";
    speakerScore?: number | null;
    pairingCode?: string | null;
    debatedAlone?: boolean;
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
    assignedToMemberId?: string;
    assignedToId?: string;
};
type Session = {
    id: string;
    sessionDate: string;
    motiontype: string;
    Chair: string;
    attendance?: Array<{
        id: string;
        status: string;
        pairingCode?: string | null;
        debatedAlone?: boolean;
        member?: {name: string} | null;
        cabinet?: {name: string} | null;
    }>;
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return {
        month: d.toLocaleString("en-US", {month: "short"}).toUpperCase(),
        day: d.getDate(),
    };
};
const fmtDeadline = (dl: string) =>
    new Date(dl).toLocaleDateString("en-US", {month: "short", day: "numeric"});
const isOverdue = (dl: string) =>
    !new Date(dl).valueOf() || new Date(dl) < new Date();

export default function CabinetDashboard() {
    const {data: session} = useSession();
    const [activeTab, setActiveTab] = useState("Dashboard");

    // Dashboard Data
    const [members, setMembers] = useState<Member[]>([]);
    const [cabinet, setCabinet] = useState<CabinetMember[]>([]);
    const [presidents, setPresidents] = useState<President[]>([]);
    const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
    const [myTasks, setMyTasks] = useState<Task[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
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

    // Form States - Session Log
    const [sessionDate, setSessionDate] = useState("");
    const [chairName, setChairName] = useState(session?.user?.name || "");
    const [chairNameInitialized, setChairNameInitialized] = useState(
        Boolean(session?.user?.name),
    );
    const [sessionMotion, setSessionMotion] = useState("");
    const [memberAttendance, setMemberAttendance] = useState<Record<string, AttendanceFormRow>>({});
    const [savingSession, setSavingSession] = useState(false);
    const [sessionSuccess, setSessionSuccess] = useState(false);

    // Form States - Report to President
    const [selectedPresidentId, setSelectedPresidentId] = useState("");
    const [messageText, setMessageText] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [messageSent, setMessageSent] = useState(false);
    const [messageError, setMessageError] = useState<string | null>(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDesktopSidebar, setIsDesktopSidebar] = useState(true);

    const userName = session?.user?.name || "Cabinet Member";
    const userImage =
        session?.user?.image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563eb&color=fff`;

    const attendanceParticipants: AttendanceParticipant[] = [
        ...members.map((member) => ({...member, role: "Member" as const})),
        ...cabinet.map((cabinetMember) => ({
            id: cabinetMember.id,
            name: cabinetMember.name,
            email: cabinetMember.email,
            role: "Cabinet" as const,
        })),
    ];
    const currentCabinetMember = cabinet.find(
        (cabinetMember) =>
            cabinetMember.email === session?.user?.email ||
            cabinetMember.id === session?.user?.id,
    );
    const userRole = currentCabinetMember?.position || "Cabinet";

    async function loadDashboardData() {
        setLoading(true);
        setError(null);
        setPartialError(null);
        try {
            const [dashRes, attRes, taskRes, sessRes] = await Promise.all([
                fetch("/api/cabinet/dashboard"),
                fetch("/api/cabinet/attendance/my"),
                fetch("/api/cabinet/tasks"),
                fetch("/api/cabinet/sessions"),
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

            if (dashRes.ok) {
                const dashData = await dashRes.json();
                setMembers(dashData.members || []);
                setCabinet(dashData.cabinet || []);
                setPresidents(dashData.presidents || []);
                if (dashData.presidents?.length > 0) {
                    setSelectedPresidentId((current) => current || dashData.presidents[0].id);
                }

                const initialAttendance: Record<
                    string,
                    {status: string; score: string; pairingCode: string; debatedAlone: boolean}
                > = {};
                dashData.members?.forEach((m: Member) => {
                    initialAttendance[m.id] = {status: "Absent", score: "", pairingCode: "", debatedAlone: false};
                });
                dashData.cabinet?.forEach((c: CabinetMember) => {
                    initialAttendance[c.id] = {status: "Absent", score: "", pairingCode: "", debatedAlone: false};
                });
                setMemberAttendance(initialAttendance);
            } else {
                setMembers([]);
                setCabinet([]);
                setPresidents([]);
                errors.push(await readMessage(dashRes, "Dashboard data failed"));
            }

            if (attRes.ok) {
                const attData = await attRes.json();
                setMyAttendance(attData.attendance || []);
            } else {
                setMyAttendance([]);
                errors.push(await readMessage(attRes, "Attendance failed"));
            }

            if (taskRes.ok) {
                const taskData = await taskRes.json();
                setMyTasks(taskData.tasks || []);
            } else {
                setMyTasks([]);
                errors.push(await readMessage(taskRes, "Tasks failed"));
            }

            if (sessRes.ok) {
                const sessData = await sessRes.json();
                setSessions(sessData.sessions || []);
            } else {
                setSessions([]);
                errors.push(await readMessage(sessRes, "Sessions failed"));
            }

            if (errors.length) {
                setPartialError(`Some data could not be loaded: ${errors.join(" | ")}`);
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
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
            if (!response.ok) {
                throw new Error("Failed to load leaderboard.");
            }
            const data: {leaderboard?: LeaderboardEntry[]} =
                await response.json();
            setLeaderboard(data.leaderboard ?? []);
        } catch (err) {
            setLeaderboard([]);
            setLeaderboardError(
                err instanceof Error ? err.message : "Failed to load leaderboard.",
            );
        } finally {
            setLeaderboardLoading(false);
        }
    }

    useEffect(() => {
        loadDashboardData();
        setSessionDate(new Date().toISOString().slice(0, 16));
    }, []);

    useEffect(() => {
        if (activeTab === "Analytics" && leaderboard.length === 0 && !leaderboardLoading) {
            loadLeaderboard(leaderboardScope);
        }
    }, [activeTab, leaderboard.length, leaderboardLoading, leaderboardScope]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 1024px)");
        const syncSidebarMode = () => setIsDesktopSidebar(mediaQuery.matches);

        syncSidebarMode();
        mediaQuery.addEventListener("change", syncSidebarMode);

        return () => {
            mediaQuery.removeEventListener("change", syncSidebarMode);
        };
    }, []);

    useEffect(() => {
        if (session?.user?.name && !chairNameInitialized) {
            setChairName(session.user.name);
            setChairNameInitialized(true);
        }
    }, [session, chairNameInitialized]);

    const handleAttendanceChange = (
        memberId: string,
        field: "status" | "score" | "pairingCode" | "debatedAlone",
        value: string | boolean,
    ) => {
        setMemberAttendance((prev) => ({
            ...prev,
            [memberId]: {
                ...prev[memberId],
                [field]: value,
            },
        }));
    };

    const getAttendanceRow = (participantId: string): AttendanceFormRow =>
        memberAttendance[participantId] ?? {
            status: "Absent",
            score: "",
            pairingCode: "",
            debatedAlone: false,
        };

    const pairingSelections = new Set(
        Object.entries(memberAttendance)
            .filter(([, row]) => !row.debatedAlone && row.pairingCode.trim())
            .map(([, row]) => row.pairingCode.trim()),
    );

    const handlePairingSelect = (participantId: string, selectedId: string) => {
        setMemberAttendance((prev) => ({
            ...prev,
            [participantId]: {
                ...getAttendanceRow(participantId),
                ...prev[participantId],
                status: selectedId ? "Present" : prev[participantId]?.status || "Absent",
                debatedAlone: false,
                pairingCode: selectedId,
            },
            ...(selectedId
                ? {
                      [selectedId]: {
                          ...getAttendanceRow(selectedId),
                          ...prev[selectedId],
                          status: "Present",
                      },
                  }
                : {}),
        }));
    };

    const handleDebatedAloneChange = (participantId: string, checked: boolean) => {
        setMemberAttendance((prev) => ({
            ...prev,
            [participantId]: {
                ...getAttendanceRow(participantId),
                ...prev[participantId],
                debatedAlone: checked,
                pairingCode: checked ? "" : prev[participantId]?.pairingCode || "",
            },
        }));
    };

    async function handleSaveSession(e: React.FormEvent) {
        e.preventDefault();
        if (!sessionMotion || !chairName || !sessionDate) return;

        setSavingSession(true);
        try {
            // 1. Create Session
            const createRes = await fetch("/api/cabinet/session/create", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    sessionDate,
                    motiontype: sessionMotion,
                    Chair: chairName,
                }),
            });

            if (!createRes.ok) throw new Error("Failed to create session");
            const {session: newSession} = await createRes.json();

            // 2. Mark Attendance
            const pairingGraph = new Map<string, Set<string>>();
            attendanceParticipants.forEach((participant) => {
                const row = memberAttendance[participant.id];
                if (!row || row.debatedAlone || row.status !== "Present") return;
                const partnerId = row.pairingCode?.trim();
                if (!partnerId) return;
                if (!pairingGraph.has(participant.id)) pairingGraph.set(participant.id, new Set());
                if (!pairingGraph.has(partnerId)) pairingGraph.set(partnerId, new Set());
                pairingGraph.get(participant.id)!.add(partnerId);
                pairingGraph.get(partnerId)!.add(participant.id);
            });

            const pairingCodesById = new Map<string, string>();
            const visited = new Set<string>();
            for (const participantId of pairingGraph.keys()) {
                if (visited.has(participantId)) continue;
                const stack = [participantId];
                const group: string[] = [];
                while (stack.length) {
                    const current = stack.pop()!;
                    if (visited.has(current)) continue;
                    visited.add(current);
                    group.push(current);
                    (pairingGraph.get(current) || new Set()).forEach((nextId) => {
                        if (!visited.has(nextId)) stack.push(nextId);
                    });
                }
                if (group.length === 2 || group.length === 3) {
                    const code = `PAIR-${group.slice().sort().join("-")}`;
                    group.forEach((id) => pairingCodesById.set(id, code));
                }
            }

            const attendanceData = attendanceParticipants.map((participant) => ({
                ...(participant.role === "Member"
                    ? {memberId: participant.id}
                    : {cabinetId: participant.id}),
                status: memberAttendance[participant.id]?.status || "Absent",
                speakerScore:
                    memberAttendance[participant.id]?.status === "Present"
                        ? parseFloat(memberAttendance[participant.id]?.score || "") || 0
                        : undefined,
                pairingCode: pairingCodesById.get(participant.id),
                debatedAlone: Boolean(memberAttendance[participant.id]?.debatedAlone),
            }));

            const markRes = await fetch("/api/cabinet/attendance/mark", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    sessionId: newSession.id,
                    attendanceData,
                }),
            });

            if (!markRes.ok) {
                const markError = await markRes
                    .json()
                    .then((data) => data?.message as string | undefined)
                    .catch(() => undefined);
                throw new Error(markError || "Failed to mark attendance");
            }

            setSessionSuccess(true);
            setSessionMotion("");
            setTimeout(() => setSessionSuccess(false), 5000);
            loadDashboardData(); // Refresh data
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSavingSession(false);
        }
    }

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!messageText.trim() || !selectedPresidentId) return;

        setSendingMessage(true);
        setMessageError(null);
        try {
            const res = await fetch("/api/cabinet/messages/president", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    message: messageText,
                    presidentId: selectedPresidentId,
                }),
            });

            if (!res.ok) throw new Error("Failed to send message");

            setMessageSent(true);
            setMessageText("");
            setTimeout(() => setMessageSent(false), 5000);
        } catch (err: any) {
            setMessageError(err.message);
        } finally {
            setSendingMessage(false);
        }
    }

    const attendanceRate =
        myAttendance.length > 0
            ? Math.round(
                  (myAttendance.filter((a) => a.status === "Present").length /
                      myAttendance.length) *
                      100,
              )
            : 0;

    const avgSpeakerScore =
        myAttendance.length > 0
            ? (
                  myAttendance.reduce(
                      (acc, curr) => acc + (curr.speakerScore || 0),
                      0,
                  ) / myAttendance.filter((a) => a.speakerScore !== null).length
              ).toFixed(1)
            : "0.0";

    const completedTasks = myTasks.filter((t) => t.completed).length;
    const pendingTasksCount = myTasks.filter((t) => !t.completed).length;
    const formatSessionPairings = (session: Session) => {
        const grouped = (session.attendance ?? []).reduce(
            (acc, item) => {
                if (item.status !== "Present") {
                    return acc;
                }
                const name = item.member?.name ?? item.cabinet?.name ?? "Unknown";
                if (item.debatedAlone) {
                    acc[`solo-${item.id}`] = [`${name} (Alone)`];
                    return acc;
                }
                const key = item.pairingCode?.trim() || "Unpaired";
                acc[key] = [...(acc[key] ?? []), name];
                return acc;
            },
            {} as Record<string, string[]>,
        );
        const entries = Object.entries(grouped);
        if (!entries.length) return [{label: "Pairings", text: "No pairing data"}];
        let pairIndex = 1;
        return entries.map(([key, names]) => {
            const isSolo = key.startsWith("solo-");
            const isUnpaired = key === "Unpaired";
            let label = `Pair ${pairIndex++}`;
            if (isSolo) label = "Solo";
            if (isUnpaired) label = "Unpaired";
            return {label, text: names.join(" - ")};
        });
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* SIDEBAR OVERLAY */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* SIDEBAR */}
            <motion.aside
                initial={false}
                animate={{
                    x: isDesktopSidebar ? 0 : isSidebarOpen ? 0 : -256,
                }}
                transition={{type: "spring", damping: 25, stiffness: 200}}
                className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col p-6 overflow-y-auto max-h-[100vh] lg:translate-x-0 lg:sticky lg:h-screen lg:max-h-screen"
            >
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3 font-bold text-xl text-white tracking-widest">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white p-1">
                            <Image
                                src="/logo.png"
                                alt="Debsoc"
                                width={32}
                                height={32}
                                className="object-contain"
                            />
                        </div>
                        <span>DEBSOC</span>
                    </div>
                    <button
                        type="button"
                        className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <Plus size={24} className="rotate-45" />
                    </button>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab("Dashboard");
                            setIsSidebarOpen(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === "Dashboard" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
                    >
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </a>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab("Sessions");
                            setIsSidebarOpen(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === "Sessions" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
                    >
                        <Calendar size={20} />
                        <span>Sessions</span>
                    </a>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab("Tasks");
                            setIsSidebarOpen(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === "Tasks" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
                    >
                        <CheckSquare size={20} />
                        <span>Tasks</span>
                        {pendingTasksCount > 0 && (
                            <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {pendingTasksCount}
                            </span>
                        )}
                    </a>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab("Analytics");
                            setIsSidebarOpen(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === "Analytics" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
                    >
                        <BarChart2 size={20} />
                        <span>Analytics</span>
                    </a>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab("Members");
                            setIsSidebarOpen(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === "Members" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
                    >
                        <Users size={20} />
                        <span>Members</span>
                    </a>
                </nav>

                <div className="flex items-center gap-3 mt-auto pt-6 pb-[calc(10px+env(safe-area-inset-bottom,0px))] border-t border-slate-800 sticky bottom-0 bg-slate-900">
                    <img
                        src={userImage}
                        alt={userName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                    />
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="font-semibold text-sm text-white truncate">
                            {userName}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                            {userRole}
                        </span>
                    </div>
                    <button
                        onClick={() => signOut({callbackUrl: "/login"})}
                        className="text-slate-400 hover:text-white"
                        title="Log out"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </motion.aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto relative">
                {/* MOBILE TOP BAR */}
                <div className="flex lg:hidden items-center justify-between mb-6 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Image
                                src="/logo.png"
                                alt="Debsoc"
                                width={28}
                                height={28}
                                className="object-contain"
                            />
                            <span className="font-bold text-slate-900 tracking-wide">
                                DEBSOC
                            </span>
                        </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 relative p-1">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                </div>

                {!loading && !error && partialError && (
                    <div className="max-w-3xl mx-auto mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle size={18} />
                        <p className="text-sm font-medium flex-1">{partialError}</p>
                        <button
                            onClick={loadDashboardData}
                            className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                        >
                            <RefreshCw size={14} /> Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                        <Loader2
                            className="animate-spin text-blue-600"
                            size={40}
                        />
                        <p className="font-medium">Loading dashboard data...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-500 gap-4">
                        <AlertCircle size={40} />
                        <p className="font-medium">{error}</p>
                        <button
                            onClick={loadDashboardData}
                            className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            <RefreshCw size={18} /> Retry
                        </button>
                    </div>
                ) : activeTab === "Dashboard" ? (
                    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
                        {/* HEADER */}
                        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-8 border-b border-slate-200 pb-4 md:pb-6">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                                        {userRole}
                                    </h1>
                                    <p className="text-slate-500 text-xs md:text-sm">
                                        Manage sessions, tasks, and reporting
                                    </p>
                                </div>
                            </div>
                            <div className="hidden lg:flex items-center gap-3 md:gap-6">
                                <button className="text-slate-400 hover:text-slate-600 relative p-1">
                                    <Bell size={24} />
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50"></span>
                                </button>
                            </div>
                        </header>

                        {/* STATS GRID */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
                            {/* Stat 1 */}
                            <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 min-h-[112px] md:min-h-0">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={20} className="md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1">
                                        My Attendance
                                    </div>
                                    <div className="text-xl md:text-2xl font-bold text-slate-900">
                                        {attendanceRate}%
                                    </div>
                                </div>
                            </div>

                            {/* Stat 2 */}
                            <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 min-h-[112px] md:min-h-0">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <Medal size={20} className="md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1">
                                        Avg. Speaker Score
                                    </div>
                                    <div className="text-xl md:text-2xl font-bold text-slate-900">
                                        {avgSpeakerScore}
                                        <span className="text-slate-400 text-xs md:text-sm font-medium">
                                            /100
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stat 3 */}
                            <div className="col-span-2 md:col-span-1 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 min-h-[112px] md:min-h-0">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <ListTodo size={20} className="md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1">
                                        Tasks Completed
                                    </div>
                                    <div className="text-xl md:text-2xl font-bold text-slate-900">
                                        {completedTasks}{" "}
                                        <span className="text-slate-400 text-xs md:text-sm font-medium normal-case">
                                            this term
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MAIN CONTENT GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                            {/* LEFT COLUMN (WIDER) */}
                            <div className="lg:col-span-2 space-y-4 md:space-y-8">
                                {/* Log New Session Card */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-4 md:p-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 bg-slate-50/50">
                                        <div className="flex items-center gap-3">
                                            <FileText
                                                className="text-blue-500"
                                                size={24}
                                            />
                                            <h2 className="text-lg font-bold text-slate-900">
                                                Log New Session
                                            </h2>
                                        </div>
                                        {sessionSuccess ? (
                                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Saved
                                                Successfully
                                            </span>
                                        ) : (
                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                                Drafting
                                            </span>
                                        )}
                                    </div>

                                    <form
                                        onSubmit={handleSaveSession}
                                        className="p-4 md:p-6"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                    Session Date & Time
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="datetime-local"
                                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                                        value={sessionDate}
                                                        onChange={(e) =>
                                                            setSessionDate(
                                                                e.target.value,
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                    Chair Name
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User
                                                            size={16}
                                                            className="text-slate-400"
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400"
                                                        placeholder="e.g. Sarah Jenkins"
                                                        value={chairName}
                                                        onChange={(e) => {
                                                            setChairNameInitialized(true);
                                                            setChairName(e.target.value);
                                                        }}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-4 md:mb-8">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                Motion / Topic
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MessageSquare
                                                        size={16}
                                                        className="text-slate-400"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400"
                                                    placeholder="e.g. THW ban all zoos"
                                                    value={sessionMotion}
                                                    onChange={(e) =>
                                                        setSessionMotion(
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-4 flex justify-between items-end">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                Participant Roster & Scoring
                                            </label>
                                            <span className="text-xs text-slate-400">
                                                {attendanceParticipants.length} Participants Loaded
                                            </span>
                                        </div>

                                        <div className="md:hidden space-y-3 mb-4">
                                            {attendanceParticipants.map((participant) => (
                                                <div
                                                    key={`mobile-${participant.role}-${participant.id}`}
                                                    className="border border-slate-200 rounded-lg p-3 bg-white"
                                                >
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                            {participant.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")
                                                                .toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block font-medium text-slate-700 text-sm truncate">
                                                                {participant.name}
                                                            </span>
                                                            <span className="block text-[11px] text-slate-400">
                                                                {participant.role}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <select
                                                            className="bg-slate-50 border border-slate-200 rounded px-2 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                            value={memberAttendance[participant.id]?.status || "Absent"}
                                                            onChange={(e) =>
                                                                handleAttendanceChange(participant.id, "status", e.target.value)
                                                            }
                                                        >
                                                            <option value="Present">Present</option>
                                                            <option value="Absent">Absent</option>
                                                            <option value="Excused">Excused</option>
                                                        </select>
                                                        <input
                                                            type="number"
                                                            placeholder="Score"
                                                            className="w-full bg-white border border-slate-200 text-center text-slate-700 rounded px-2 py-2 text-xs outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                                                            value={memberAttendance[participant.id]?.score || ""}
                                                            onChange={(e) =>
                                                                handleAttendanceChange(participant.id, "score", e.target.value)
                                                            }
                                                            disabled={memberAttendance[participant.id]?.status !== "Present"}
                                                            min="0"
                                                            max="100"
                                                        />
                                                        <select
                                                            className="col-span-2 bg-white border border-slate-200 text-slate-700 rounded px-2 py-2 text-xs outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                                                            value={memberAttendance[participant.id]?.pairingCode || ""}
                                                            onChange={(e) => handlePairingSelect(participant.id, e.target.value)}
                                                            disabled={memberAttendance[participant.id]?.debatedAlone}
                                                        >
                                                            <option value="">No Pairing</option>
                                                            {attendanceParticipants
                                                                .filter(
                                                                    (candidate) =>
                                                                        candidate.id !== participant.id &&
                                                                        (!pairingSelections.has(candidate.id) ||
                                                                            memberAttendance[participant.id]?.pairingCode ===
                                                                                candidate.id),
                                                                )
                                                                .map((candidate) => (
                                                                    <option key={`mobile-opt-${candidate.role}-${candidate.id}`} value={candidate.id}>
                                                                        {candidate.name} ({candidate.role})
                                                                    </option>
                                                                ))}
                                                        </select>
                                                        <label className="col-span-2 flex items-center gap-2 text-xs text-slate-600">
                                                            <input
                                                                type="checkbox"
                                                                checked={memberAttendance[participant.id]?.debatedAlone || false}
                                                                onChange={(e) =>
                                                                    handleDebatedAloneChange(participant.id, e.target.checked)
                                                                }
                                                            />
                                                            Alone
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="hidden md:block border border-slate-200 rounded-lg overflow-x-auto mb-4 md:mb-8 max-h-[360px] md:max-h-[400px] overflow-y-auto">
                                            <table className="w-full text-left border-collapse min-w-[500px]">
                                                <thead className="sticky top-0 z-10">
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500">
                                                            Participant
                                                        </th>
                                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">
                                                            Status
                                                        </th>
                                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">
                                                            Score (0-100)
                                                        </th>
                                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">
                                                            Pairing
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {attendanceParticipants.map((participant) => (
                                                        <tr
                                                            key={`${participant.role}-${participant.id}`}
                                                            className="hover:bg-slate-50/50"
                                                        >
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                                        {participant.name
                                                                            .split(
                                                                                " ",
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    n,
                                                                                ) =>
                                                                                    n[0],
                                                                            )
                                                                            .join(
                                                                                "",
                                                                            )
                                                                            .toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <span className="block font-medium text-slate-700 text-sm truncate max-w-[120px] md:max-w-[200px]">
                                                                            {participant.name}
                                                                        </span>
                                                                        <span className="block text-[11px] text-slate-400">
                                                                            {participant.role}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <select
                                                                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                                    value={
                                                                        memberAttendance[
                                                                            participant
                                                                                .id
                                                                        ]
                                                                            ?.status ||
                                                                        "Absent"
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleAttendanceChange(
                                                                            participant.id,
                                                                            "status",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                >
                                                                    <option value="Present">
                                                                        Present
                                                                    </option>
                                                                    <option value="Absent">
                                                                        Absent
                                                                    </option>
                                                                    <option value="Excused">
                                                                        Excused
                                                                    </option>
                                                                </select>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    className="w-16 md:w-20 mx-auto block bg-white border border-slate-200 text-center text-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                                                                    value={
                                                                        memberAttendance[
                                                                            participant
                                                                                .id
                                                                        ]
                                                                            ?.score ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleAttendanceChange(
                                                                            participant.id,
                                                                            "score",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        memberAttendance[
                                                                            participant
                                                                                .id
                                                                        ]
                                                                            ?.status !==
                                                                        "Present"
                                                                    }
                                                                    min="0"
                                                                    max="100"
                                                                />
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex flex-col md:flex-row gap-2 items-center justify-center">
                                                                    <select
                                                                        className="w-44 bg-white border border-slate-200 text-slate-700 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                                                                        value={memberAttendance[participant.id]?.pairingCode || ""}
                                                                        onChange={(e) =>
                                                                            handlePairingSelect(participant.id, e.target.value)
                                                                        }
                                                                        disabled={memberAttendance[participant.id]?.debatedAlone}
                                                                    >
                                                                        <option value="">No Pairing</option>
                                                                        {attendanceParticipants
                                                                            .filter(
                                                                                (candidate) =>
                                                                                    candidate.id !== participant.id &&
                                                                                    (!pairingSelections.has(candidate.id) ||
                                                                                        memberAttendance[participant.id]?.pairingCode ===
                                                                                            candidate.id),
                                                                            )
                                                                            .map((candidate) => (
                                                                                <option key={`${candidate.role}-${candidate.id}`} value={candidate.id}>
                                                                                    {candidate.name} ({candidate.role})
                                                                                </option>
                                                                            ))}
                                                                    </select>
                                                                    <label className="flex items-center gap-1 text-[11px] text-slate-600">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                memberAttendance[participant.id]?.debatedAlone || false
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleDebatedAloneChange(participant.id, e.target.checked)
                                                                            }
                                                                        />
                                                                        Alone
                                                                    </label>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {attendanceParticipants.length === 0 && (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="py-8 text-center text-slate-500 text-sm italic"
                                                            >
                                                                No participants
                                                                available to
                                                                load.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSessionMotion("");
                                                    const initial: any = {};
                                                    attendanceParticipants.forEach(
                                                        (participant) =>
                                                            (initial[participant.id] = {
                                                                status: "Absent",
                                                                score: "",
                                                                pairingCode: "",
                                                                debatedAlone: false,
                                                            }),
                                                    );
                                                    setMemberAttendance(
                                                        initial,
                                                    );
                                                }}
                                                className="px-5 py-2.5 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                Reset
                                            </button>
                                            <button
                                                disabled={
                                                    savingSession ||
                                                    attendanceParticipants.length === 0
                                                }
                                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                                            >
                                                {savingSession ? (
                                                    <>
                                                        <Loader2
                                                            className="animate-spin"
                                                            size={18}
                                                        />{" "}
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileText size={18} />{" "}
                                                        Save Session Log
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="space-y-6">
                                {/* My Tasks Card */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                                        <h2 className="text-lg font-bold text-slate-900">
                                            My Tasks
                                        </h2>
                                        <span className="text-xs text-slate-400">
                                            {pendingTasksCount} Pending
                                        </span>
                                    </div>
                                    <div className="p-5">
                                        <div className="space-y-5 max-h-[300px] overflow-y-auto pr-1">
                                            {myTasks.length === 0 ? (
                                                <div className="text-center py-6 text-slate-400 italic text-sm">
                                                    No tasks assigned yet.
                                                </div>
                                            ) : (
                                                myTasks.map((task) => {
                                                    const overdue =
                                                        !task.completed &&
                                                        isOverdue(
                                                            task.deadline,
                                                        );
                                                    return (
                                                        <div
                                                            key={task.id}
                                                            className={`pl-3 border-l-2 ${task.completed ? "border-slate-200" : overdue ? "border-red-500" : "border-emerald-500"}`}
                                                        >
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span
                                                                    className={`${task.completed ? "bg-slate-100 text-slate-600" : overdue ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"} text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`}
                                                                >
                                                                    {task.completed
                                                                        ? "Completed"
                                                                        : overdue
                                                                          ? "Overdue"
                                                                          : "Upcoming"}
                                                                </span>
                                                                <span className="text-xs text-slate-400">
                                                                    Due{" "}
                                                                    {fmtDeadline(
                                                                        task.deadline,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <h3
                                                                className={`text-sm font-semibold ${task.completed ? "text-slate-500 line-through" : "text-slate-900"}`}
                                                            >
                                                                {task.name}
                                                            </h3>
                                                            {task.description && (
                                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                                                    {
                                                                        task.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <div className="mt-6 text-center">
                                            <button
                                                onClick={() =>
                                                    setActiveTab("Tasks")
                                                }
                                                className="text-blue-600 text-sm font-medium hover:underline"
                                            >
                                                View All Tasks
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Report to President Card */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                                            <User size={16} />
                                        </div>
                                        <h2 className="text-base font-bold text-slate-900">
                                            Report to President
                                        </h2>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4">
                                        Send an anonymous message directly to
                                        the President.
                                    </p>

                                    <form onSubmit={handleSendMessage}>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none mb-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            value={selectedPresidentId}
                                            onChange={(e) =>
                                                setSelectedPresidentId(
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        >
                                            <option value="" disabled>
                                                Select Recipient
                                            </option>
                                            {presidents.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    To: {p.name}
                                                </option>
                                            ))}
                                        </select>

                                        <textarea
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none mb-3"
                                            placeholder="Type your message here..."
                                            rows={4}
                                            value={messageText}
                                            onChange={(e) =>
                                                setMessageText(e.target.value)
                                            }
                                            required
                                        ></textarea>

                                        {messageError && (
                                            <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                                                <AlertCircle size={12} />{" "}
                                                {messageError}
                                            </p>
                                        )}
                                        {messageSent && (
                                            <p className="text-xs text-emerald-600 mb-3 flex items-center gap-1">
                                                <CheckCircle2 size={12} />{" "}
                                                Message sent anonymously!
                                            </p>
                                        )}

                                        <button
                                            disabled={
                                                sendingMessage ||
                                                !messageText.trim() ||
                                                !selectedPresidentId
                                            }
                                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                                        >
                                            {sendingMessage ? (
                                                <>
                                                    <Loader2
                                                        className="animate-spin"
                                                        size={16}
                                                    />{" "}
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={16} /> Send
                                                    Anonymously
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>

                                {/* Peer Feedback Card */}
                                <div className="bg-blue-600 rounded-xl shadow-md p-5 text-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare size={20} />
                                        <h2 className="text-base font-bold">
                                            Peer Feedback
                                        </h2>
                                    </div>
                                    <p className="text-blue-100 text-xs mb-4">
                                        Send constructive tips to members after
                                        a session.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab("Members")}
                                        className="w-full border border-blue-400 bg-blue-700/50 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium text-sm transition-colors"
                                    >
                                        Open Feedback Tool
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === "Sessions" ? (
                    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
                        <header className="mb-4 md:mb-8 border-b border-slate-200 pb-4 md:pb-6">
                            <h1 className="text-2xl font-bold text-slate-900 mb-1">
                                Debate Sessions
                            </h1>
                            <p className="text-slate-500 text-sm">
                                View all recorded sessions and their motions
                            </p>
                        </header>
                        <div className="md:hidden space-y-3">
                            {sessions.length === 0 ? (
                                <div className="py-10 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200">
                                    No sessions recorded yet.
                                </div>
                            ) : (
                                sessions.map((s) => {
                                    const {month, day} = fmtDate(s.sessionDate);
                                    const pairings = formatSessionPairings(s);
                                    return (
                                        <div key={`mobile-session-${s.id}`} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded flex flex-col items-center justify-center font-bold text-[10px]">
                                                    <span>{month}</span>
                                                    <span className="text-sm">{day}</span>
                                                </div>
                                                <div className="text-sm text-slate-600">
                                                    {new Date(s.sessionDate).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                                                </div>
                                            </div>
                                            <div className="space-y-1 mb-2">
                                                <p className="text-sm font-semibold text-slate-900 break-words [overflow-wrap:anywhere]">{s.motiontype}</p>
                                                <p className="text-xs text-slate-500">Chair: {s.Chair}</p>
                                            </div>
                                            <div className="mt-3 border-t border-slate-100 pt-3 space-y-1">
                                                {pairings.map((entry, idx) => (
                                                    <p key={`${s.id}-pair-${idx}`} className="text-xs text-slate-700">
                                                        <span className="font-semibold text-slate-500 mr-1">{entry.label}:</span>
                                                        {entry.text}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Motion
                                        </th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Chair
                                        </th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Pairings
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sessions.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-12 text-center text-slate-400 italic"
                                            >
                                                No sessions recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        sessions.map((s) => {
                                            const {month, day} = fmtDate(
                                                s.sessionDate,
                                            );
                                            return (
                                                <tr
                                                    key={s.id}
                                                    className="hover:bg-slate-50 transition-colors"
                                                >
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded flex flex-col items-center justify-center font-bold text-[10px]">
                                                                <span>
                                                                    {month}
                                                                </span>
                                                                <span className="text-sm">
                                                                    {day}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm text-slate-600">
                                                                {new Date(
                                                                    s.sessionDate,
                                                                ).toLocaleTimeString(
                                                                    [],
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    },
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 font-semibold text-slate-900 text-sm max-w-[300px] break-words [overflow-wrap:anywhere]">
                                                        {s.motiontype}
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-slate-600">
                                                        {s.Chair}
                                                    </td>
                                                    <td className="py-4 px-6 text-xs text-slate-600">
                                                        <div className="space-y-1">
                                                            {formatSessionPairings(s).map((entry, idx) => (
                                                                <div key={`${s.id}-desktop-pair-${idx}`} className="text-slate-700">
                                                                    <span className="font-semibold text-slate-500 mr-1">
                                                                        {entry.label}:
                                                                    </span>
                                                                    <span>{entry.text}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === "Members" ? (
                    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
                        <header className="mb-4 md:mb-8 border-b border-slate-200 pb-4 md:pb-6">
                            <h1 className="text-2xl font-bold text-slate-900 mb-1">
                                Society Members
                            </h1>
                            <p className="text-slate-500 text-sm">
                                View members and give anonymous feedback
                            </p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {members.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-300">
                                    No members found.
                                </div>
                            ) : (
                                members.map((m) => (
                                    <div
                                        key={m.id}
                                        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg">
                                                {m.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">
                                                    {m.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 truncate w-40">
                                                    {m.email}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const feedback = prompt(
                                                    `Give anonymous feedback to ${m.name}:`,
                                                );
                                                if (feedback?.trim()) {
                                                    fetch(
                                                        "/api/cabinet/feedback/give",
                                                        {
                                                            method: "POST",
                                                            headers: {
                                                                "Content-Type":
                                                                    "application/json",
                                                            },
                                                            body: JSON.stringify(
                                                                {
                                                                    feedback,
                                                                    memberId:
                                                                        m.id,
                                                                },
                                                            ),
                                                        },
                                                    ).then((res) => {
                                                        if (res.ok)
                                                            alert(
                                                                "Feedback sent!",
                                                            );
                                                        else
                                                            alert(
                                                                "Failed to send feedback.",
                                                            );
                                                    });
                                                }
                                            }}
                                            className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare size={16} /> Give
                                            Feedback
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : activeTab === "Tasks" ? (
                    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
                        <header className="mb-4 md:mb-8 border-b border-slate-200 pb-4 md:pb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                                    My Task List
                                </h1>
                                <p className="text-slate-500 text-sm">
                                    Tasks assigned to you by the President
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    {myTasks.length} Total
                                </span>
                                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    {completedTasks} Done
                                </span>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 gap-6">
                            {myTasks.length === 0 ? (
                                <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                    <ListTodo
                                        size={48}
                                        className="mx-auto text-slate-300 mb-4"
                                    />
                                    <p className="text-slate-500 font-medium">
                                        No tasks found in your log.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myTasks
                                        .slice()
                                        .sort(
                                            (a, b) =>
                                                new Date(a.deadline).getTime() -
                                                new Date(b.deadline).getTime(),
                                        )
                                        .map((task) => {
                                            const overdue =
                                                !task.completed &&
                                                isOverdue(task.deadline);
                                            return (
                                                <div
                                                    key={task.id}
                                                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4"
                                                >
                                                    <div
                                                        className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${task.completed ? "bg-emerald-100 text-emerald-600" : overdue ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
                                                    >
                                                        {task.completed ? (
                                                            <CheckCircle2
                                                                size={20}
                                                            />
                                                        ) : (
                                                            <Clock size={20} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h3
                                                                className={`font-bold text-slate-900 ${task.completed ? "line-through text-slate-400" : ""}`}
                                                            >
                                                                {task.name}
                                                            </h3>
                                                            <span className="text-xs font-medium text-slate-400">
                                                                {fmtDeadline(
                                                                    task.deadline,
                                                                )}
                                                            </span>
                                                        </div>
                                                        {task.description && (
                                                            <p className="text-sm text-slate-600 mb-3">
                                                                {
                                                                    task.description
                                                                }
                                                            </p>
                                                        )}
                                                        <div className="flex gap-2">
                                                            {task.completed ? (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded uppercase tracking-wider">
                                                                    Completed
                                                                </span>
                                                            ) : overdue ? (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-600 rounded uppercase tracking-wider">
                                                                    Overdue
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded uppercase tracking-wider">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === "Analytics" ? (
                    <div className="max-w-6xl mx-auto space-y-6">
                        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                                    Performance Analytics
                                </h1>
                                <p className="text-slate-500 text-sm">
                                    Deep dive into your session metrics and the live speaker leaderboard.
                                </p>
                            </div>
                            <div className="flex gap-2 p-1 rounded-full border border-slate-200 bg-white w-fit">
                                {(
                                    [
                                        ["overall", "Overall"],
                                        ["bi-monthly", "Last 60 days"],
                                    ] as const
                                ).map(([scope, label]) => (
                                    <button
                                        key={scope}
                                        type="button"
                                        onClick={() => {
                                            setLeaderboardScope(scope);
                                            loadLeaderboard(scope);
                                        }}
                                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${leaderboardScope === scope ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Attendance Breakdown */}
                            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">
                                    Attendance Breakdown
                                </h3>
                                <div className="flex items-end gap-3 h-40 mb-6">
                                    {["Present", "Absent"].map(
                                        (status) => {
                                            const count = myAttendance.filter(
                                                (a) => a.status === status,
                                            ).length;
                                            const total =
                                                myAttendance.length || 1;
                                            const pct = Math.round(
                                                (count / total) * 100,
                                            );
                                            const color =
                                                status === "Present"
                                                    ? "bg-blue-500"
                                                    : "bg-red-500";
                                            return (
                                                <div
                                                    key={status}
                                                    className="flex-1 h-full flex flex-col items-center justify-end gap-2 group"
                                                >
                                                    <div className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {pct}%
                                                    </div>
                                                    <div
                                                        className={`w-full max-w-16 ${color} rounded-t-lg transition-all duration-500`}
                                                        style={{
                                                            height: `${Math.max(pct, 5)}%`,
                                                        }}
                                                    ></div>
                                                    <div className="text-xs font-semibold text-slate-600 mt-2">
                                                        {status}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {count} sessions
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 text-center italic">
                                    Calculated from your {myAttendance.length}{" "}
                                    most recent sessions.
                                </p>
                            </div>

                            {/* Task Completion Progress */}
                            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">
                                    Task Progress
                                </h3>
                                <div className="flex flex-col items-center justify-center h-40 mb-6 relative">
                                    <div className="w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-slate-900">
                                                {Math.round(
                                                    (completedTasks /
                                                        (myTasks.length || 1)) *
                                                        100,
                                                )}
                                                %
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                Complete
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="text-lg font-bold text-emerald-600">
                                            {completedTasks}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            Done
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-blue-600">
                                            {pendingTasksCount}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            Pending
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-blue-200">
                            <div className="w-20 h-20 bg-blue-500/30 rounded-2xl flex items-center justify-center shrink-0">
                                <Medal size={40} />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-xl font-bold mb-2">
                                    Speaker Performance Leader
                                </h3>
                                <p className="text-blue-100 text-sm leading-relaxed">
                                    Your average score is in the top 15% of
                                    active cabinet members this term. Keep
                                    refining your arguments and structure!
                                </p>
                            </div>
                            <div className="bg-white/10 px-6 py-4 rounded-xl text-center backdrop-blur-sm border border-white/20">
                                <div className="text-3xl font-bold">
                                    {avgSpeakerScore}/100
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-100">
                                    Avg Score
                                </div>
                            </div>
                        </div>

                        {leaderboardLoading ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-10 flex flex-col items-center gap-3 text-slate-500">
                                <Loader2
                                    size={28}
                                    className="animate-spin text-blue-600"
                                />
                                <p className="text-sm font-medium">
                                    Loading leaderboard...
                                </p>
                            </div>
                        ) : leaderboardError ? (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 flex items-center gap-3">
                                <AlertCircle size={18} />
                                <p className="text-sm font-medium">
                                    {leaderboardError}
                                </p>
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
                                <BarChart2
                                    size={38}
                                    className="mx-auto mb-3 text-slate-300"
                                />
                                <p className="font-medium">
                                    No leaderboard data available yet.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">
                                            Ranked Debaters
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 mt-2">
                                            {leaderboard.length}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">
                                            Top Score
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 mt-2">
                                            {leaderboard[0]?.score ?? 0}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">
                                            Top Speaker
                                        </p>
                                        <p className="text-lg font-bold text-slate-900 mt-2 truncate">
                                            {leaderboard[0]?.name ?? "-"}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                                                        Rank
                                                    </th>
                                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                                                        Name
                                                    </th>
                                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                                                        Role
                                                    </th>
                                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                                                        Sessions
                                                    </th>
                                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">
                                                        Score
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {leaderboard.map((entry) => (
                                                    <tr
                                                        key={`${entry.type}-${entry.id}`}
                                                        className="hover:bg-slate-50"
                                                    >
                                                        <td className="py-3 px-4 font-semibold text-slate-700">
                                                            #{entry.rank}
                                                        </td>
                                                        <td className="py-3 px-4 font-medium text-slate-900">
                                                            {entry.name}
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-600">
                                                            {entry.type}
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-600">
                                                            {entry.sessions}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                                                            {entry.score}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            {activeTab}
                        </h1>
                        <p>This section is coming soon.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
