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
        } catch (error) {
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
        } catch (error) {
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
                            className="group relative flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] rounded-2xl transition-all duration-300"
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
                                        <p className="text-sm font-medium text-white">
                                            {user.name}
                                        </p>
                                        {user.position && (
                                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] uppercase tracking-tighter rounded-md border border-indigo-500/20">
                                                {user.position}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 font-light">
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
                                        className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
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
                                        className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
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
                                                    ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white"
                                                    : "bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white"
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
                                    className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                    title="Delete User"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="text-right group-hover:opacity-0 transition-opacity pr-2 hidden sm:block">
                                <p className="text-[10px] text-zinc-600 font-mono">
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
        <div className="min-h-screen bg-[#030303] text-zinc-100 p-6 md:p-12 lg:p-20 font-sans">
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
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
                    <div>
                        <motion.div
                            initial={{x: -20, opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-[0.3em] font-light mb-2"
                        >
                            <ShieldCheck
                                size={14}
                                className="text-white opacity-50"
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
                            <h1 className="text-3xl md:text-4xl font-extralight tracking-tight text-white italic">
                                Tech Head{" "}
                                <span className="font-bold not-italic">
                                    Dashboard
                                </span>
                            </h1>
                        </div>
                        <p className="text-zinc-500 text-sm font-light">
                            Verify and manage all society members and
                            executives.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1 sm:flex-none">
                            <Search
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                                size={16}
                            />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-all w-full sm:w-64"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveTab("pairing")}
                                className={`flex-1 sm:flex-none px-4 py-3.5 border rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm ${
                                    activeTab === "pairing"
                                        ? "bg-white text-black border-white"
                                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                }`}
                                title="Pairing dashboard"
                            >
                                <Gavel size={16} />
                                <span>Pairing</span>
                            </button>
                            <button
                                onClick={fetchData}
                                className="flex-1 sm:flex-none p-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 text-white flex items-center justify-center"
                            >
                                <RefreshCw
                                    size={18}
                                    className={loading ? "animate-spin" : ""}
                                />
                            </button>
                            <button
                                onClick={() => signOut({callbackUrl: "/login"})}
                                className="flex-1 sm:flex-none p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                                title="Log Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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
                            className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl"
                        >
                            <stat.icon
                                className={`${stat.color} mb-4 opacity-80`}
                                size={24}
                                strokeWidth={1.5}
                            />
                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">
                                {stat.label}
                            </p>
                            <p className="text-3xl font-light text-white">
                                {stat.count !== undefined
                                    ? stat.count
                                    : stat.value}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="mb-10">
                    <div className="flex gap-8 border-b border-white/5">
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
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 pb-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all relative ${activeTab === tab.id ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="tab-active"
                                        className="absolute bottom-0 left-0 w-full h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
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
