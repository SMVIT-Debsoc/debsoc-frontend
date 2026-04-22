"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  LogOut
} from "lucide-react";
import { toast } from "react-hot-toast";
import { signOut } from "next-auth/react";

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
  const [activeTab, setActiveTab] = useState<"pending" | "verified">("pending");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unres, verres] = await Promise.all([
        fetch("/api/techhead/unverified-users"),
        fetch("/api/techhead/verified-users")
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

  const handleAction = async (role: string, id: string, action: "verify" | "unverify" | "delete") => {
    const roleKey = role.toLowerCase();
    const endpoint = `/api/techhead/${action}/${roleKey}`;
    const method = action === "delete" ? "DELETE" : "POST";
    const body = JSON.stringify({ [`${roleKey}Id`]: id, id });

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body
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

  const renderUsers = (data: UserRecord[], role: string, isUnverified: boolean) => {
    const filtered = data.filter(u => 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase())
    );

    if (filtered.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-4 ml-2 font-bold">{role}s</h3>
        <div className="grid gap-3">
          {filtered.map((user) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={user.id}
              className="group relative flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] rounded-2xl transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                  <span className="text-sm font-medium text-white">{user.name[0]}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    {user.position && (
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] uppercase tracking-tighter rounded-md border border-indigo-500/20">
                        {user.position}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 font-light">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {isUnverified ? (
                  <button
                    onClick={() => handleAction(role, user.id, "verify")}
                    className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                    title="Verify User"
                  >
                    <UserCheck size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(role, user.id, "unverify")}
                    className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
                    title="Unverify User"
                  >
                    <UserMinus size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleAction(role, user.id, "delete")}
                  className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                  title="Delete User"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="text-right group-hover:opacity-0 transition-opacity pr-2 hidden sm:block">
                <p className="text-[10px] text-zinc-600 font-mono">
                  {new Date(user.createdAt).toLocaleDateString()}
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
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
          <div>
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-[0.3em] font-light mb-2"
            >
              <ShieldCheck size={14} className="text-white opacity-50" />
              Technical Administration
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-extralight tracking-tight text-white mb-2 italic">Tech Head <span className="font-bold not-italic">Dashboard</span></h1>
            <p className="text-zinc-500 text-sm font-light">Verify and manage all society members and executives.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
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
                onClick={fetchData}
                className="flex-1 sm:flex-none p-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 text-white flex items-center justify-center"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
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
            { label: "Pending Verification", count: (unverified?.unverifiedPresidents.length || 0) + (unverified?.unverifiedCabinet.length || 0) + (unverified?.unverifiedMembers.length || 0), icon: ShieldAlert, color: "text-amber-400" },
            { label: "Verified Users", count: (verified?.verifiedPresidents.length || 0) + (verified?.verifiedCabinet.length || 0) + (verified?.verifiedMembers.length || 0), icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Admin Status", value: "Authorized", icon: Users, color: "text-indigo-400" }
          ].map((stat, i) => (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              key={stat.label}
              className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl"
            >
              <stat.icon className={`${stat.color} mb-4 opacity-80`} size={24} strokeWidth={1.5} />
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">{stat.label}</p>
              <p className="text-3xl font-light text-white">{stat.count !== undefined ? stat.count : stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="mb-10">
          <div className="flex gap-8 border-b border-white/5">
            {[
              { id: "pending", label: "Pending", icon: Clock },
              { id: "verified", label: "Verified", icon: UserCheck }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all relative ${activeTab === tab.id ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
              >
                <tab.icon size={12} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 w-full h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="animate-spin text-zinc-700 mb-4" size={40} />
              <p className="text-zinc-600 text-sm font-light uppercase tracking-widest">Accessing records...</p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === "pending" ? (
                <>
                  {unverified && (
                    <>
                      {renderUsers(unverified.unverifiedPresidents, "President", true)}
                      {renderUsers(unverified.unverifiedCabinet, "Cabinet", true)}
                      {renderUsers(unverified.unverifiedMembers, "Member", true)}
                      {(!unverified.unverifiedPresidents.length && !unverified.unverifiedCabinet.length && !unverified.unverifiedMembers.length) && (
                        <div className="text-center py-20">
                          <p className="text-zinc-600 text-sm italic font-light italic">All users are currently verified.</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {verified && (
                    <>
                      {renderUsers(verified.verifiedPresidents, "President", false)}
                      {renderUsers(verified.verifiedCabinet, "Cabinet", false)}
                      {renderUsers(verified.verifiedMembers, "Member", false)}
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
