"use client";

import React, {useEffect, useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
    Users,
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
    LogOut,
    Gavel,
    ArrowUpCircle,
    ArrowDownCircle,
    X,
} from "lucide-react";
import toast, {Toaster} from "react-hot-toast";
import {signOut} from "next-auth/react";
import Image from "next/image";
import PairingDashboard from "@/components/pairing/PairingDashboard";
import ProfileAvatar from "@/components/ProfileAvatar";
import PairingBackdrop from "@/components/pairing/PairingBackdrop";
import ThemeToggle from "@/components/pairing/ThemeToggle";

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

export default function TechHeadDashboard() {
    const [unverified, setUnverified] = useState<UnverifiedData | null>(null);
    const [verified, setVerified] = useState<VerifiedData | null>(null);
    const [loading, setLoading] = useState(true);
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

    const fetchData = async () => {
        setLoading(true);
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
                const err = await res.json();
                toast.error(err.message || `Failed to ${action} user`);
            }
        } catch {
            toast.error("An error occurred");
        }
    };

    const openRoleChange = (
        user: UserRecord,
        fromRole: "President" | "Cabinet" | "Member",
        toRole: "President" | "Cabinet" | "Member",
    ) => {
        setRolePosition(toRole === "Cabinet" ? (user.position ?? "") : "");
        setRoleChange({user, fromRole, toRole});
    };

    const submitRoleChange = async () => {
        if (!roleChange) return;
        const {user, fromRole, toRole} = roleChange;
        if (toRole === "Cabinet" && !rolePosition.trim()) {
            toast.error("Please enter a cabinet position");
            return;
        }
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
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || "Failed to change role");
            }
        } catch {
            toast.error("An error occurred");
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
                                        title="Verify User"
                                    >
                                        <UserCheck size={16} />
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
                                        title="Unverify User"
                                    >
                                        <UserMinus size={16} />
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
                                        >
                                            {t.direction === "promote" ? (
                                                <ArrowUpCircle size={16} />
                                            ) : (
                                                <ArrowDownCircle size={16} />
                                            )}
                                        </button>
                                    ))}
                                <button
                                    onClick={() =>
                                        handleAction(role, user.id, "delete")
                                    }
                                    className="rounded-full border border-red-600/20 bg-red-500/10 p-2 text-red-700 transition-all hover:bg-red-500 hover:text-white dark:text-red-300"
                                    title="Delete User"
                                >
                                    <Trash2 size={16} />
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
        <div className="pairing-shell relative min-h-screen overflow-x-hidden bg-[#f2eee8] p-4 text-slate-900 dark:bg-[#0a0a0a] dark:text-slate-100 sm:p-6 lg:p-8">
            <PairingBackdrop />
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
            <div className="relative z-10 mx-auto w-full max-w-[1440px]">
                <header className="glass-card mb-6 flex flex-col gap-5 rounded-[28px] p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <motion.div
                            initial={{x: -20, opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400"
                        >
                            <ShieldCheck
                                size={14}
                                className="text-slate-700 dark:text-slate-200"
                            />
                            Technical Administration
                        </motion.div>
                        <div className="flex items-center gap-4 mb-2">
                            <Image
                                src="/logo.png"
                                alt="Debsoc"
                                width={36}
                                height={36}
                                className="object-contain"
                            />
                            <h1 className="text-3xl font-medium tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                                Tech Head{" "}
                                    <span className="font-semibold">
                                    Dashboard
                                </span>
                            </h1>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Verify and manage all society members and
                            executives.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1 sm:flex-none">
                            <Search
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
                                size={16}
                            />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-11 w-full rounded-full border border-slate-900/10 bg-white/70 py-3 pl-12 pr-6 text-sm text-slate-950 outline-none transition focus:ring-2 focus:ring-violet-400/60 dark:border-white/10 dark:bg-white/[0.08] dark:text-white sm:w-64"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveTab("pairing")}
                                    className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border px-4 text-sm transition-all active:scale-95 sm:flex-none ${
                                    activeTab === "pairing"
                                        ? "border-slate-900/10 bg-slate-950 text-white dark:border-white/10 dark:bg-white dark:text-slate-950"
                                        : "border-slate-900/10 bg-white/60 text-slate-800 hover:bg-white dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-100 dark:hover:bg-white/[0.14]"
                                }`}
                                title="Pairing dashboard"
                            >
                                <Gavel size={16} />
                                <span>Pairing</span>
                            </button>
                            <button
                                onClick={fetchData}
                                className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-slate-900/10 bg-white/60 px-4 text-slate-800 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 dark:border-white/10 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14] sm:flex-none"
                            >
                                <RefreshCw
                                    size={18}
                                    className={loading ? "animate-spin" : ""}
                                />
                            </button>
                            <ThemeToggle />
                            <button
                                onClick={() => signOut({callbackUrl: "/login"})}
                                className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-red-600/25 bg-red-500/[0.08] px-4 text-red-700 transition hover:bg-red-500/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 dark:border-red-300/25 dark:bg-red-500/[0.12] dark:text-red-200 dark:hover:bg-red-500/[0.20] sm:flex-none"
                                title="Log Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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
                        {
                            label: "Admin Status",
                            value: "Authorized",
                            icon: Users,
                            color: "text-indigo-400",
                        },
                    ].map((stat, i) => (
                        <motion.div
                            initial={{y: 20, opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            transition={{delay: i * 0.1}}
                            key={stat.label}
                            className="glass-card rounded-[24px] p-5 sm:p-6"
                        >
                            <stat.icon
                                className={`${stat.color} mb-4 opacity-80 dark:brightness-125`}
                                size={24}
                                strokeWidth={1.5}
                            />
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                {stat.label}
                            </p>
                            <p className="text-3xl font-medium text-slate-950 dark:text-white">
                                {stat.count !== undefined
                                    ? stat.count
                                    : stat.value}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="glass-card mb-6 rounded-[24px] p-2">
                    <div className="flex flex-wrap gap-1 border-b border-slate-900/10 dark:border-white/10">
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
                                className={`relative flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 ${activeTab === tab.id ? "bg-slate-950 text-white dark:bg-white/[0.12] dark:text-white" : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"}`}
                            >
                                <tab.icon size={12} />
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
                    ) : loading ? (
                        <motion.div
                            key="loading"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <Loader2
                                className="animate-spin text-zinc-700 mb-4"
                                size={40}
                            />
                            <p className="text-zinc-600 text-sm font-light uppercase tracking-widest">
                                Accessing records...
                            </p>
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

            <AnimatePresence>
                {roleChange && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        onClick={() => !roleSubmitting && setRoleChange(null)}
                    >
                        <motion.div
                            initial={{scale: 0.95, y: 10, opacity: 0}}
                            animate={{scale: 1, y: 0, opacity: 1}}
                            exit={{scale: 0.95, y: 10, opacity: 0}}
                            transition={{duration: 0.2}}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative"
                        >
                            <button
                                onClick={() =>
                                    !roleSubmitting && setRoleChange(null)
                                }
                                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5"
                            >
                                <X size={16} />
                            </button>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-2">
                                Change Role
                            </p>
                            <h2 className="text-xl font-light text-white mb-1">
                                {roleChange.fromRole}{" "}
                                <span className="text-zinc-600">→</span>{" "}
                                <span className="font-bold">
                                    {roleChange.toRole}
                                </span>
                            </h2>
                            <p className="text-sm text-zinc-500 mb-6 font-light">
                                {roleChange.user.name} · {roleChange.user.email}
                            </p>

                            {roleChange.toRole === "Cabinet" && (
                                <div className="mb-6">
                                    <label className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-bold block mb-2">
                                        Cabinet Position
                                    </label>
                                    <input
                                        type="text"
                                        value={rolePosition}
                                        onChange={(e) =>
                                            setRolePosition(e.target.value)
                                        }
                                        placeholder="e.g. General Secretary"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3 mb-6 font-light">
                                Their attendance, scoring history, and pairing
                                records will be re-linked to the new role. Login
                                credentials are preserved.
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setRoleChange(null)}
                                    disabled={roleSubmitting}
                                    className="flex-1 py-3 rounded-2xl border border-white/10 text-zinc-400 hover:bg-white/5 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitRoleChange}
                                    disabled={roleSubmitting}
                                    className="flex-1 py-3 rounded-2xl bg-white text-black font-medium hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {roleSubmitting && (
                                        <Loader2
                                            size={14}
                                            className="animate-spin"
                                        />
                                    )}
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
