"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  User,
  Users,
  Star,
  ChevronRight,
  Quote,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [selectedRole, setSelectedRole] = useState("Member");
  const [position, setPosition] = useState("");
  const [secretKey, setSecretKey] = useState("");

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup") setMode("signup");
    else setMode("login");
  }, [searchParams]);

  const handleAuth = () => {
    if (mode === "signup") {
      document.cookie = `debsoc_requested_role=${selectedRole}; path=/; max-age=120; SameSite=Lax`;
      if (selectedRole === "cabinet" && position) {
        document.cookie = `debsoc_requested_position=${position}; path=/; max-age=120; SameSite=Lax`;
      }
    } else if (secretKey) {
      document.cookie = `debsoc_promotion_key=${secretKey}; path=/; max-age=60; SameSite=Lax`;
    }

    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex flex-col md:flex-row w-full max-w-5xl gap-6 md:gap-0 h-auto md:h-[640px] items-stretch">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] md:rounded-r-none md:rounded-l-[2.5rem] p-8 md:p-14 flex flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 via-transparent to-rose-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-[0.2em] text-white">DEBSOC</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extralight tracking-tight text-white leading-none mb-6">
            THE ART OF <br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-white to-zinc-500 italic">
              ARGUMENT.
            </span>
          </h1>
          <div className="space-y-4 max-w-xs">
            <div className="flex gap-2">
              <div className="h-[1px] w-8 bg-white/20 mt-3" />
              <p className="text-zinc-400 text-sm font-light leading-relaxed">
                Think. Speak. Listen. The three pillars of elite intellectual discourse at SMVIT.
              </p>
            </div>
          </div>
        </div>
        <div className="relative z-10 pt-10">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <Quote size={24} className="text-zinc-600 mb-4" />
            <p className="text-zinc-300 text-sm italic font-light leading-relaxed">
              "Honest disagreement is often a good sign of progress."
            </p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-4 font-medium">
              Mahatma Gandhi
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 bg-zinc-950 border border-white/10 md:border-l-0 rounded-[2.5rem] md:rounded-l-none md:rounded-r-[2.5rem] p-8 md:p-14 flex flex-col relative overflow-hidden"
      >
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b ${mode === "login" ? "from-indigo-500/10" : "from-rose-500/10"} to-transparent blur-3xl pointer-events-none transition-colors duration-700`} />
        <div className="relative z-10 flex p-1 bg-white/[0.03] border border-white/5 rounded-2xl mb-10">
          <button onClick={() => setMode("login")} className={`flex-1 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-medium transition-all duration-300 relative ${mode === "login" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            {mode === "login" && <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/[0.08] border border-white/10 rounded-xl shadow-inner" />}
            <span className="relative z-10">Sign In</span>
          </button>
          <button onClick={() => setMode("signup")} className={`flex-1 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-medium transition-all duration-300 relative ${mode === "signup" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            {mode === "signup" && <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/[0.08] border border-white/10 rounded-xl shadow-inner" />}
            <span className="relative z-10">Join Us</span>
          </button>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">
              {mode === "login" ? "Welcome Back" : "Join Society"}
            </h2>
            <p className="text-zinc-500 text-sm font-light">
              {mode === "login" ? "Continue your intellectual journey." : "Become part of the SMVIT legacy."}
            </p>
          </div>
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {mode === "signup" ? (
                <motion.div key="signup-fields" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium ml-1 block">Registration Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ id: "Member", icon: User, label: "Member" }, { id: "cabinet", icon: Users, label: "Cabinet" }, { id: "President", icon: Star, label: "President" }].map((roleType) => (
                        <button key={roleType.id} onClick={() => setSelectedRole(roleType.id)} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${selectedRole === roleType.id ? "bg-white/[0.08] border-rose-500/40 text-white shadow-[0_0_20px_rgba(244,63,94,0.15)] scale-[1.02]" : "bg-white/[0.01] border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300"}`}>
                          <roleType.icon size={18} className={selectedRole === roleType.id ? "text-rose-400" : ""} />
                          <span className="text-[9px] uppercase tracking-wider font-medium">{roleType.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedRole === "cabinet" && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                      <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Secretary, Treasurer" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-6 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-rose-500/30 transition-all text-sm" />
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="login-fields" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <details className="group">
                    <summary className="list-none cursor-pointer text-zinc-600 hover:text-zinc-400 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors flex items-center justify-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-zinc-800 group-open:bg-indigo-400 transition-colors" />
                      Elevate Permissions
                    </summary>
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      <input
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        type="password"
                        placeholder="Access Key"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-6 text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/30 transition-all text-sm"
                      />
                    </div>
                  </details>
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={handleAuth} className={`group relative flex items-center justify-center gap-4 w-full ${mode === "login" ? "bg-white text-black" : "bg-rose-600 text-white"} py-4 rounded-2xl font-bold uppercase tracking-[0.2em] overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] text-[11px] shadow-lg`}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                <path fill={mode === "login" ? "#4285F4" : "#fff"} d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill={mode === "login" ? "#34A853" : "#fff"} d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill={mode === "login" ? "#FBBC05" : "#fff"} d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill={mode === "login" ? "#EA4335" : "#fff"} d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
              </svg>
              <span className="relative z-10">{mode === "login" ? "Sign In with Google" : "Join with Google"}</span>
              <ChevronRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/5 text-center">
          <p className="text-zinc-600 text-[9px] uppercase tracking-[0.3em] font-medium">Managed by Debsoc Infrastructure</p>
        </div>
      </motion.div>
    </div>
  );
}

