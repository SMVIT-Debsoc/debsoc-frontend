"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, User, Users, Star } from "lucide-react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState("Member");
  const [position, setPosition] = useState("");
  return (
    <motion.div
      className="backdrop-blur-3xl bg-zinc-950/40 border border-white/10 shadow-[0_0_80px_-20px_rgba(244,63,94,0.3)] rounded-[2.5rem] p-8 sm:p-14 w-full relative overflow-hidden text-center"
    >
      {/* Internal Card Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-rose-500/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-rose-400/50 to-transparent" />
      
      <div className="relative z-10 flex flex-col items-center mb-10">
        <motion.div 
          whileHover={{ rotate: -15, scale: 1.1 }}
          className="w-16 h-16 bg-white/[0.05] rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-md"
        >
          <ShieldCheck className="text-white w-8 h-8" strokeWidth={1.5} />
        </motion.div>
        <h1 className="text-[2.25rem] font-bold tracking-tighter uppercase mb-4 text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-white to-zinc-400">
          JOIN US
        </h1>
        <p className="text-zinc-400 text-sm font-light max-w-[280px] mx-auto leading-relaxed">
          Create your Debsoc account instantly using your institution email.
        </p>
      </div>

      <div className="relative z-10 space-y-6">
        
        {/* Role Selection */}
        <div className="space-y-4 pt-2">
          <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-medium ml-1 block text-left">Select Registration Role</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "Member", icon: User },
              { id: "cabinet", icon: Users, label: "Cabinet" },
              { id: "President", icon: Star }
            ].map((roleType) => (
              <button
                key={roleType.id}
                onClick={() => setSelectedRole(roleType.id)}
                className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all duration-300 ${
                  selectedRole === roleType.id 
                    ? "bg-white/[0.08] border-rose-500/50 text-white shadow-[0_0_20px_rgba(244,63,94,0.2)] scale-105" 
                    : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300 hover:bg-white/[0.04]"
                }`}
              >
                <roleType.icon size={20} className={selectedRole === roleType.id ? "text-rose-400" : ""} />
                <span className="text-[10px] uppercase tracking-wider font-medium">{roleType.label || roleType.id}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {selectedRole === "cabinet" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="text-left mt-4">
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2 ml-1 block font-medium">Cabinet Position</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Secretary, Treasurer"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-6 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all duration-300 text-sm backdrop-blur-md"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => {
            document.cookie = `debsoc_requested_role=${selectedRole}; path=/; max-age=120; SameSite=Lax`;
            if (selectedRole === "cabinet" && position) {
              document.cookie = `debsoc_requested_position=${position}; path=/; max-age=120; SameSite=Lax`;
            }
            signIn("google", { callbackUrl: "/dashboard" });
          }}
          className={`group relative flex items-center justify-center gap-4 w-full bg-white text-black py-4 rounded-2xl font-semibold uppercase tracking-widest overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] text-sm ${selectedRole === 'cabinet' && !position.trim() ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
          </svg>
          <span className="relative z-10">Join with Google</span>
          <ArrowRight size={18} className="relative z-10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </button>

        <div className="pt-6">
            <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-medium leading-relaxed text-center">
                By joining, you agree to our <br/> 
                <span className="text-zinc-400 hover:text-white cursor-pointer underline underline-offset-4 decoration-zinc-800 hover:decoration-white transition-all">Equity Policy</span>
            </p>
        </div>
      </div>
      
      {/* Decorative corner element */}
      <div className="absolute top-[-20%] left-[-20%] w-1/2 h-1/2 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />
    </motion.div>
  );
}
