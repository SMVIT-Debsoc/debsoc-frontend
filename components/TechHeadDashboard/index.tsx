"use client";

import React, {useCallback, useEffect, useRef, useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
    ShieldCheck,
    ShieldAlert,
    UserCheck,
    UserMinus,
    Trash2,
    Search,
    Loader2,
    RefreshCw,
    CheckCircle2,
    Clock,
    Gavel,
    ArrowUpCircle,
    ArrowDownCircle,
    LogOut,
    X,
} from "lucide-react";
import toast, {Toaster} from "react-hot-toast";
import {signOut} from "next-auth/react";
import Image from "next/image";
import PairingDashboard from "@/components/pairing/PairingDashboard";
import ProfileAvatar from "@/components/ProfileAvatar";
import DebsocOverlayScrollbar from "@/components/pairing/DebsocOverlayScrollbar";
import ThemeToggle from "@/components/pairing/ThemeToggle";
import DebassWorkspaceProvider, { useDebassWorkspace } from "@/components/pairing/DebassWorkspaceProvider";
import AssistantSettings from "@/components/pairing/AssistantSettings";
import { PageSkeleton } from "@/components/pairing/Loading";
import { SecondaryButton } from "@/components/pairing/ui";

interface UserRecord {
    id: string;
    name: string;
    email: string;
    position?: string;
    createdAt: string;
}

interface UnverifiedData {
    unverifiedPresidents: UserRecord[];
    unverifiedCabinet: UserRecord[];
    unverifiedMembers: UserRecord[];
}

interface VerifiedData {
    verifiedPresidents: UserRecord[];
    verifiedCabinet: UserRecord[];
    verifiedMembers: UserRecord[];
}

const ROLE_CHANGE_FAILURE = "Could not change this user’s role. No records were deleted. Please try again.";
const ROLE_CHANGE_NETWORK_FAILURE = "We couldn’t complete that action. Please try again.";
const TECHHEAD_ACTION_FAILURE = "We couldn’t complete that action. Please try again.";

export default function TechHeadDashboard() {
    const [unverified, setUnverified] = useState<UnverifiedData | null>(null);
    const [verified, setVerified] = useState<VerifiedData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<
        "pending" | "verified" | "pairing"
    >("pending");
    // Restore the active tab from the URL on mount, then keep the URL in
    // sync, so a browser refresh stays on the tab being viewed.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        const tab = new URLSearchParams(window.location.search).get("tab");
        if (tab === "pending" || tab === "verified" || tab === "pairing") {
            setActiveTab(tab);
        }
    }, []);

    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.get("tab") === activeTab) return;
        url.searchParams.set("tab", activeTab);
        window.history.replaceState(null, "", url);
    }, [activeTab]);

    const [roleChange, setRoleChange] = useState<{
        user: UserRecord;
        fromRole: "President" | "Cabinet" | "Member";
        toRole: "President" | "Cabinet" | "Member";
    } | null>(null);
    const [rolePosition, setRolePosition] = useState("");
    const [roleSubmitting, setRoleSubmitting] = useState(false);
    const [roleChangeError, setRoleChangeError] = useState<string | null>(null);
    const roleChangeTriggerRef = useRef<HTMLButtonElement | null>(null);
    const roleChangeCloseRef = useRef<HTMLButtonElement | null>(null);
    const roleChangeDialogRef = useRef<HTMLDivElement | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ user: UserRecord; role: string } | null>(null);

    const closeRoleChange = useCallback(() => {
        if (roleSubmitting) return;
        setRoleChange(null);
        setRolePosition("");
        setRoleChangeError(null);
    }, [roleSubmitting]);

    useEffect(() => {
        if (!roleChange) {
            const trigger = roleChangeTriggerRef.current;
            roleChangeTriggerRef.current = null;
            if (trigger) {
                const focusTimer = window.setTimeout(() => trigger.focus(), 0);
                return () => window.clearTimeout(focusTimer);
            }
            return;
        }

        roleChangeTriggerRef.current =
            document.activeElement instanceof HTMLButtonElement
                ? document.activeElement
                : null;
        const focusTimer = window.setTimeout(() => roleChangeCloseRef.current?.focus(), 0);
        const handleDialogKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeRoleChange();
                return;
            }

            if (event.key !== "Tab") return;
            const dialog = roleChangeDialogRef.current;
            if (!dialog) return;
            const focusable = Array.from(
                dialog.querySelectorAll<HTMLElement>(
                    "button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
                ),
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        window.addEventListener("keydown", handleDialogKeyDown);
        return () => {
            window.clearTimeout(focusTimer);
            window.removeEventListener("keydown", handleDialogKeyDown);
        };
    }, [closeRoleChange, roleChange]);

    const fetchData = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [unres, verres] = await Promise.all([
                fetch("/api/techhead/unverified-users"),
                fetch("/api/techhead/verified-users"),
            ]);

            if (unres.ok && verres.ok) {
                setUnverified(await unres.json());
                setVerified(await verres.json());
            }
        } catch {
            setLoadError("Couldn’t load TechHead user records. Try again.");
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleAction = async (
        role: string,
        id: string,
        action: "verify" | "unverify" | "delete",
    ) => {
        const roleKey = role.toLowerCase();
        const endpoint = `/api/techhead/${action}/${roleKey}`;
        const method = action === "delete" ? "DELETE" : "POST";
        const body = JSON.stringify({[`${roleKey}Id`]: id, id});

        try {
            const res = await fetch(endpoint, {
                method,
                headers: {"Content-Type": "application/json"},
                body,
            });

            if (res.ok) {
                toast.success(`Successfully ${action}ed user`);
                fetchData();
            } else {
                toast.error(TECHHEAD_ACTION_FAILURE);
            }
        } catch {
            toast.error(TECHHEAD_ACTION_FAILURE);
        }
    };

    const requestDelete = (user: UserRecord, role: string) => setDeleteConfirm({ user, role });

    const openRoleChange = (
        user: UserRecord,
        fromRole: "President" | "Cabinet" | "Member",
        toRole: "President" | "Cabinet" | "Member",
    ) => {
        setRolePosition(toRole === "Cabinet" ? (user.position ?? "") : "");
        setRoleChangeError(null);
        setRoleChange({user, fromRole, toRole});
    };

    const submitRoleChange = async () => {
        if (!roleChange) return;
        const {user, fromRole, toRole} = roleChange;
        if (toRole === "Cabinet" && !rolePosition.trim()) {
            setRoleChangeError("Please enter a cabinet position");
            return;
        }
        setRoleChangeError(null);
        setRoleSubmitting(true);
        try {
            const res = await fetch("/api/techhead/change-role", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    id: user.id,
                    fromRole: fromRole.toLowerCase(),
                    toRole: toRole.toLowerCase(),
                    position:
                        toRole === "Cabinet" ? rolePosition.trim() : undefined,
                }),
            });
            if (res.ok) {
                toast.success(`Moved ${user.name} to ${toRole}`);
                setRoleChange(null);
                setRolePosition("");
                fetchData();
            } else {
                setRoleChangeError(ROLE_CHANGE_FAILURE);
            }
        } catch {
            setRoleChangeError(ROLE_CHANGE_NETWORK_FAILURE);
        } finally {
            setRoleSubmitting(false);
        }
    };

    const targetsForRole = (
        role: "President" | "Cabinet" | "Member",
    ): {
        toRole: "President" | "Cabinet" | "Member";
        direction: "promote" | "demote";
    }[] => {
        if (role === "Member") {
            return [
                {toRole: "Cabinet", direction: "promote"},
                {toRole: "President", direction: "promote"},
            ];
        }
        if (role === "Cabinet") {
            return [
                {toRole: "President", direction: "promote"},
                {toRole: "Member", direction: "demote"},
            ];
        }
        return [
            {toRole: "Cabinet", direction: "demote"},
            {toRole: "Member", direction: "demote"},
        ];
    };

    const renderUsers = (
        data: UserRecord[],
        role: string,
        isUnverified: boolean,
    ) => {
        const filtered = data.filter(
            (u) =>
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()),
        );

        if (filtered.length === 0) return null;

        return (
            <div className="mb-8">
                <h3 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-4 ml-2 font-bold">
                    {role}s
                </h3>
                <div className="grid gap-3">
                    {filtered.map((user) => (
                        <motion.div
                            layout
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, scale: 0.95}}
                            key={user.id}
                            className="glass-card group relative flex items-center justify-between rounded-[20px] p-4 transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <div className="flex items-center gap-4">
                                <ProfileAvatar
                                    name={user.name}
                                    seed={user.id}
                                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 group-hover:border-white/20"
                                    initialsClassName="text-sm"
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-slate-950 dark:text-white">
                                            {user.name}
                                        </p>
                                        {user.position && (
                                            <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[9px] uppercase tracking-tight text-violet-800 dark:text-violet-300">
                                                {user.position}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {user.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                {isUnverified ? (
                                    <button
                                        onClick={() =>
                                            handleAction(
                                                role,
                                                user.id,
                                                "verify",
                                            )
                                        }
                                        className="rounded-full border border-emerald-600/20 bg-emerald-500/10 p-2 text-emerald-700 transition-all hover:bg-emerald-500 hover:text-white dark:text-emerald-300"
                                        aria-label={`Verify ${user.name}`}
                                        title="Verify User"
                                    >
                                        <UserCheck size={16} aria-hidden="true" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() =>
                                            handleAction(
                                                role,
                                                user.id,
                                                "unverify",
                                            )
                                        }
                                        className="rounded-full border border-amber-600/20 bg-amber-500/10 p-2 text-amber-700 transition-all hover:bg-amber-500 hover:text-white dark:text-amber-300"
                                        aria-label={`Unverify ${user.name}`}
                                        title="Unverify User"
                                    >
                                        <UserMinus size={16} aria-hidden="true" />
                                    </button>
                                )}
                                {!isUnverified &&
                                    targetsForRole(
                                        role as
                                            | "President"
                                            | "Cabinet"
                                            | "Member",
                                    ).map((t) => (
                                        <button
                                            key={t.toRole}
                                            onClick={() =>
                                                openRoleChange(
                                                    user,
                                                    role as
                                                        | "President"
                                                        | "Cabinet"
                                                        | "Member",
                                                    t.toRole,
                                                )
                                            }
                                            className={`p-2 rounded-lg transition-all ${
                                                t.direction === "promote"
                                                    ? "border border-violet-600/20 bg-violet-500/10 text-violet-800 hover:bg-violet-500 hover:text-white dark:text-violet-300"
                                                    : "border border-sky-600/20 bg-sky-500/10 text-sky-800 hover:bg-sky-500 hover:text-white dark:text-sky-300"
                                            }`}
                                            title={`${t.direction === "promote" ? "Promote" : "Demote"} to ${t.toRole}`}
                                            aria-label={`${t.direction === "promote" ? "Promote" : "Demote"} ${user.name} to ${t.toRole}`}
                                        >
                                            {t.direction === "promote" ? (
                                                <ArrowUpCircle size={16} aria-hidden="true" />
                                            ) : (
                                                <ArrowDownCircle size={16} aria-hidden="true" />
                                            )}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => requestDelete(user, role)}
                                        aria-label={`Delete ${user.name}`}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive transition hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        title="Delete user"
                                    >
                                        <Trash2 size={16} aria-hidden="true" />
                                    </button>
                            </div>

                            <div className="text-right group-hover:opacity-0 transition-opacity pr-2 hidden sm:block">
                                <p className="font-mono text-[10px] text-slate-500 dark:text-slate-500">
                                    {new Date(
                                        user.createdAt,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <DebassWorkspaceProvider>
        <div className="pairing-shell relative min-h-screen overflow-x-hidden p-4 text-foreground sm:p-6 lg:p-8">
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: "#18181b",
                        color: "#f4f4f5",
                        border: "1px solid rgba(255,255,255,0.1)",
                    },
                }}
            />
            <DebsocOverlayScrollbar className="dashboard-main-scroll relative z-10 mx-auto w-full max-w-[1440px]" style={{ height: "var(--dashboard-scroll-height)" }}>
            <div className="w-full">
                <header className="glass-card mb-6 flex flex-col gap-5 rounded-[28px] border-border/80 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <motion.div
                            initial={{x: -20, opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground"
                        >
                            <ShieldCheck
                                size={14}
                                className="text-primary"
                            />
                            Technical Administration
                        </motion.div>
                        <div className="flex items-center gap-4 mb-2">
                            <Image
                                src="/logo.png"
                                alt="Debsoc"
                                width={972}
                                height={1190}
                                style={{width: "36px", height: "auto"}}
                                className="object-contain"
                            />
                            <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                                Tech Head{" "}
                                    <span className="font-semibold">
                                    Dashboard
                                </span>
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Verify and manage all society members and
                            executives.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1 sm:flex-none">
                            <Search
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                                size={16}
                            />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-11 w-full rounded-full border border-border bg-background py-3 pl-12 pr-6 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring sm:w-64"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveTab("pairing")}
                                    className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border px-4 text-sm transition-all active:scale-95 sm:flex-none ${
                                    activeTab === "pairing"
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-secondary text-secondary-foreground hover:bg-accent"
                                }`}
                                title="Pairing dashboard"
                            >
                                <Gavel size={16} aria-hidden="true" />
                                <span>Pairing</span>
                            </button>
                            <button
                                onClick={fetchData}
                                aria-label="Refresh user records"
                                title="Refresh user records"
                                className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-border bg-secondary px-4 text-secondary-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none"
                            >
                                <RefreshCw
                                    size={18}
                                    aria-hidden="true"
                                    className={loading ? "motion-safe:animate-spin" : ""}
                                />
                            </button>
                            <ThemeToggle />
                            <AssistantSettings collapsed />
                            <TechHeadLogoutButton />
                        </div>
                    </div>
                </header>

                <section className="mb-6" aria-labelledby="techhead-glance-title">
                    <h2 id="techhead-glance-title" className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">At a glance</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                        {
                            label: "Pending Verification",
                            count:
                                (unverified?.unverifiedPresidents.length || 0) +
                                (unverified?.unverifiedCabinet.length || 0) +
                                (unverified?.unverifiedMembers.length || 0),
                            icon: ShieldAlert,
                            color: "text-amber-400",
                        },
                        {
                            label: "Verified Users",
                            count:
                                (verified?.verifiedPresidents.length || 0) +
                                (verified?.verifiedCabinet.length || 0) +
                                (verified?.verifiedMembers.length || 0),
                            icon: CheckCircle2,
                            color: "text-emerald-400",
                        },
                    ].map((stat, i) => (
                        <motion.div
                            initial={{y: 20, opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            transition={{delay: i * 0.1}}
                            key={stat.label}
                            className="glass-card rounded-[24px] border-border/80 p-5 sm:p-6"
                        >
                            <stat.icon
                                className={`${stat.color} mb-4 opacity-80 dark:brightness-125`}
                                size={24}
                                strokeWidth={1.5}
                            />
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                {stat.label}
                            </p>
                            <p className="text-3xl font-medium text-foreground">
                                {stat.count}
                            </p>
                        </motion.div>
                    ))}
                    </div>
                </section>

                <div className="glass-card mb-6 rounded-[24px] border-border/80 p-2">
                    <div className="flex flex-wrap gap-1 border-b border-border">
                        {[
                            {id: "pending", label: "Pending", icon: Clock},
                            {
                                id: "verified",
                                label: "Verified",
                                icon: UserCheck,
                            },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as "pending" | "verified" | "pairing")}
                                className={`relative flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                            >
                                <tab.icon size={15} aria-hidden="true" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="tab-active"
                                    className="hidden"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "pairing" ? (
                        <motion.div
                            key="pairing"
                            initial={{opacity: 0, x: 20}}
                            animate={{opacity: 1, x: 0}}
                            exit={{opacity: 0, x: -20}}
                            transition={{
                                duration: 0.4,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                        >
                            <PairingDashboard
                                role="TechHead"
                                userName="Tech Head"
                                embedded
                            />
                        </motion.div>
                    ) : loadError ? (
                        <div className="flex min-h-48 flex-col items-center justify-center rounded-[24px] border border-destructive/30 bg-destructive/10 px-5 text-center"><p role="alert" className="text-sm text-destructive">{loadError}</p><SecondaryRetryButton onClick={() => void fetchData()} /></div>
                    ) : loading ? (
                        <motion.div
                            key="loading"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                        >
                            <PageSkeleton variant="table" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{opacity: 0, x: 20}}
                            animate={{opacity: 1, x: 0}}
                            exit={{opacity: 0, x: -20}}
                            transition={{
                                duration: 0.4,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                        >
                            {activeTab === "pending" ? (
                                <>
                                    {unverified && (unverified.unverifiedPresidents.length + unverified.unverifiedCabinet.length + unverified.unverifiedMembers.length) > 0 && <div className="mb-4"><h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Needs attention</h2><p className="mt-1 text-sm text-muted-foreground">Verify new accounts or resolve pending access before they join the society workspace.</p></div>}
                                    {unverified && (
                                        <>
                                            {renderUsers(
                                                unverified.unverifiedPresidents,
                                                "President",
                                                true,
                                            )}
                                            {renderUsers(
                                                unverified.unverifiedCabinet,
                                                "Cabinet",
                                                true,
                                            )}
                                            {renderUsers(
                                                unverified.unverifiedMembers,
                                                "Member",
                                                true,
                                            )}
                                            {!unverified.unverifiedPresidents
                                                .length &&
                                                !unverified.unverifiedCabinet
                                                    .length &&
                                                !unverified.unverifiedMembers
                                                    .length && (
                                                    <div className="text-center py-20">
                                                        <p className="text-zinc-600 text-sm italic font-light italic">
                                                            All users are
                                                            currently verified.
                                                        </p>
                                                    </div>
                                                )}
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    {verified && (
                                        <>
                                            {renderUsers(
                                                verified.verifiedPresidents,
                                                "President",
                                                false,
                                            )}
                                            {renderUsers(
                                                verified.verifiedCabinet,
                                                "Cabinet",
                                                false,
                                            )}
                                            {renderUsers(
                                                verified.verifiedMembers,
                                                "Member",
                                                false,
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            </DebsocOverlayScrollbar>

            <AnimatePresence>
                {roleChange && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="fixed inset-0 z-[110] flex items-end justify-center bg-foreground/50 p-3 backdrop-blur-sm sm:items-center sm:p-6"
                        onClick={closeRoleChange}
                    >
                        <motion.div
                            initial={{scale: 0.95, y: 10, opacity: 0}}
                            animate={{scale: 1, y: 0, opacity: 1}}
                            exit={{scale: 0.95, y: 10, opacity: 0}}
                            transition={{duration: 0.2}}
                            onClick={(e) => e.stopPropagation()}
                            ref={roleChangeDialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="role-change-title"
                            aria-describedby="role-change-description"
                            className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-2xl sm:p-8"
                        >
                            <button
                                ref={roleChangeCloseRef}
                                type="button"
                                onClick={closeRoleChange}
                                disabled={roleSubmitting}
                                aria-label="Close role change dialog"
                                title="Close"
                                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                            <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                Change Role
                            </p>
                            <h2 id="role-change-title" className="mb-1 text-xl font-light text-foreground">
                                {roleChange.fromRole}{" "}
                                <span className="text-muted-foreground">→</span>{" "}
                                <span className="font-bold">
                                    {roleChange.toRole}
                                </span>
                            </h2>
                            <p id="role-change-description" className="mb-6 text-sm font-light text-muted-foreground">
                                {roleChange.user.name} · {roleChange.user.email}
                            </p>

                            {roleChange.toRole === "Cabinet" && (
                                <div className="mb-6">
                                    <label htmlFor="role-change-position" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                                        Cabinet Position
                                    </label>
                                    <input
                                        id="role-change-position"
                                        type="text"
                                        value={rolePosition}
                                        onChange={(e) =>
                                            setRolePosition(e.target.value)
                                        }
                                        placeholder="e.g. General Secretary"
                                        className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </div>
                            )}

                            <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-light leading-5 text-amber-900 dark:text-amber-200">
                                Their attendance, scoring history, and pairing
                                records will be re-linked to the new role. Login
                                credentials are preserved.
                            </div>

                            {roleChangeError && (
                                <p className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm leading-5 text-destructive" role="alert" aria-live="polite">
                                    {roleChangeError}
                                </p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeRoleChange}
                                    disabled={roleSubmitting}
                                    className="min-h-11 flex-1 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitRoleChange}
                                    disabled={roleSubmitting}
                                    className="min-h-11 flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {roleSubmitting && (
                                        <Loader2
                                            size={14}
                                            className="motion-safe:animate-spin"
                                            aria-hidden="true"
                                        />
                                    )}
                                    {roleSubmitting ? "Saving…" : "Confirm"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {deleteConfirm && <div className="fixed inset-0 z-[110] flex items-end justify-center bg-foreground/50 p-4 backdrop-blur-sm sm:items-center" role="presentation" onMouseDown={() => setDeleteConfirm(null)}><div className="w-full max-w-md rounded-[24px] border border-border bg-card p-6 text-foreground shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title" aria-describedby="delete-user-description" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><Trash2 size={18} aria-hidden="true" /></span><div><h2 id="delete-user-title" className="text-lg font-semibold">Delete user?</h2><p id="delete-user-description" className="mt-1 text-sm leading-6 text-muted-foreground">This permanently removes {deleteConfirm.user.name} from the {deleteConfirm.role.toLowerCase()} records. This action cannot be undone.</p></div></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><SecondaryButton type="button" onClick={() => setDeleteConfirm(null)}>Keep user</SecondaryButton><button type="button" onClick={() => { const target = deleteConfirm; setDeleteConfirm(null); void handleAction(target.role, target.user.id, "delete"); }} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 size={16} aria-hidden="true" /> Delete user</button></div></div></div>}
        </div>
        </DebassWorkspaceProvider>
    );
}

function TechHeadLogoutButton() {
    const {clearKey, clearAssistantSession} = useDebassWorkspace();
    const HOLD_DURATION_MS = 1350;
    const RING_RADIUS = 22;
    const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
    const [holding, setHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const animationFrameRef = useRef<number | null>(null);
    const startedAtRef = useRef<number | null>(null);
    const holdingRef = useRef(false);
    const confirmedRef = useRef(false);
    const updateProgressRef = useRef<(timestamp: number) => void>(() => undefined);

    const cancelAnimation = useCallback(() => {
        if (animationFrameRef.current !== null) {
            window.cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, []);

    const resetHold = useCallback(() => {
        cancelAnimation();
        startedAtRef.current = null;
        holdingRef.current = false;
        setHolding(false);
        setProgress(0);
        setCompleted(false);
    }, [cancelAnimation]);

    const confirmLogout = useCallback(() => {
        if (confirmedRef.current) return;
        confirmedRef.current = true;
        setConfirmed(true);
        setHolding(false);
        setCompleted(true);
        setProgress(1);
        clearKey();
        clearAssistantSession();
        void signOut({callbackUrl: "/login"});
    }, [clearAssistantSession, clearKey]);

    const updateProgress = useCallback((timestamp: number) => {
        const startedAt = startedAtRef.current;
        if (!holdingRef.current || startedAt === null) return;

        const nextProgress = Math.min((timestamp - startedAt) / HOLD_DURATION_MS, 1);
        setProgress(nextProgress);
        if (nextProgress >= 1) {
            cancelAnimation();
            startedAtRef.current = null;
            holdingRef.current = false;
            confirmLogout();
            return;
        }

        animationFrameRef.current = window.requestAnimationFrame((nextTimestamp) => updateProgressRef.current(nextTimestamp));
    }, [cancelAnimation, confirmLogout]);

    useEffect(() => {
        updateProgressRef.current = updateProgress;
    }, [updateProgress]);

    const startHold = useCallback(() => {
        if (holdingRef.current || confirmedRef.current) return;
        cancelAnimation();
        startedAtRef.current = performance.now();
        holdingRef.current = true;
        setCompleted(false);
        setHolding(true);
        setProgress(0);
        animationFrameRef.current = window.requestAnimationFrame((timestamp) => updateProgressRef.current(timestamp));
    }, [cancelAnimation]);

    useEffect(() => {
        const cancelOnWindowExit = () => resetHold();
        const cancelOnVisibilityChange = () => {
            if (document.visibilityState !== "visible") cancelOnWindowExit();
        };

        window.addEventListener("blur", cancelOnWindowExit);
        document.addEventListener("visibilitychange", cancelOnVisibilityChange);
        return () => {
            window.removeEventListener("blur", cancelOnWindowExit);
            document.removeEventListener("visibilitychange", cancelOnVisibilityChange);
            cancelAnimation();
        };
    }, [cancelAnimation, resetHold]);

    const releaseHold = () => {
        if (holdingRef.current) resetHold();
    };

    const progressOffset = RING_CIRCUMFERENCE * (1 - progress);

    return (
        <button
            type="button"
            aria-label="Hold to log out"
            title="Hold to log out"
            disabled={confirmed}
            aria-disabled={confirmed}
            onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                startHold();
            }}
            onPointerUp={releaseHold}
            onPointerCancel={releaseHold}
            onPointerLeave={releaseHold}
            onKeyDown={(event) => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    resetHold();
                    return;
                }
                if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
                    event.preventDefault();
                    startHold();
                }
            }}
            onKeyUp={(event) => {
                if (event.key === "Enter" || event.key === " ") releaseHold();
            }}
            onBlur={releaseHold}
            className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-destructive/35 bg-destructive/10 p-0 text-destructive backdrop-blur-md transition hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none"
        >
            <svg
                className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
                focusable="false"
            >
                <circle cx="24" cy="24" r={RING_RADIUS} className="text-destructive/25" stroke="currentColor" strokeWidth="2" />
                <circle
                    cx="24"
                    cy="24"
                    r={RING_RADIUS}
                    className="text-destructive transition-[stroke-dashoffset] duration-75 ease-linear motion-reduce:transition-none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={progressOffset}
                />
            </svg>
            <LogOut size={18} aria-hidden="true" />
            <span className="sr-only" role="status" aria-live="polite">
                {completed ? "Logging out…" : holding ? "Keep holding to log out" : "Hold to log out"}
            </span>
            <span
                className="sr-only"
                role="progressbar"
                aria-label="Logout confirmation progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
            />
        </button>
    );
}

function SecondaryRetryButton({onClick}: {onClick: () => void}) {
    return <SecondaryButton type="button" onClick={onClick} className="mt-4">Try again</SecondaryButton>;
}
