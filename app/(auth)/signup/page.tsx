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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-10 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden text-center"
    >
      {/* Top gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      <div className="flex flex-col items-center mb-12">
        <motion.div 
          whileHover={{ rotate: -15, scale: 1.1 }}
          className="w-16 h-16 bg-white/[0.05] rounded-2xl flex items-center justify-center mb-6 border border-white/10"
        >
          <ShieldCheck className="text-white w-8 h-8" strokeWidth={1} />
        </motion.div>
        <h1 className="text-3xl font-extralight tracking-[0.25em] uppercase text-white mb-4">Join Us</h1>
        <p className="text-zinc-400 text-sm font-light max-w-[280px] mx-auto leading-relaxed">
          Create your Debsoc account instantly using your institution email.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Role Selection */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium ml-1 block text-left">Select Registration Role</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "Member", icon: User },
              { id: "cabinet", icon: Users, label: "Cabinet" },
              { id: "President", icon: Star }
            ].map((roleType) => (
              <button
                key={roleType.id}
                onClick={() => setSelectedRole(roleType.id)}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-300 ${
                  selectedRole === roleType.id 
                    ? "bg-white/[0.05] border-white/20 text-white" 
                    : "bg-transparent border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300"
                }`}
              >
                <roleType.icon size={18} />
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
              <div className="group relative text-left">
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 ml-1 block font-medium">Cabinet Position</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Secretary, Treasurer"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-3.5 px-6 text-zinc-400 placeholder:text-zinc-800 focus:outline-none focus:ring-1 focus:ring-white/10 focus:border-white/10 transition-all duration-300 text-sm"
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
          className={`group ${selectedRole === 'cabinet' && !position.trim() ? 'opacity-50 pointer-events-none' : ''} relative flex items-center justify-center gap-4 w-full bg-white text-black py-4 rounded-2xl font-medium overflow-hidden transition-all duration-500 hover:bg-zinc-200 active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.1)]`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
            />
          </svg>
          <span className="relative z-10 text-sm tracking-widest uppercase font-semibold">Join with Google</span>
          <ArrowRight size={18} className="relative z-10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </button>

        <div className="pt-4 flex flex-col items-center gap-2">
            <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-medium leading-relaxed">
                By joining, you agree to our <br/> 
                <span className="text-zinc-400 hover:text-white cursor-pointer underline underline-offset-4 decoration-zinc-800 hover:decoration-white transition-all">Equity Policy</span>
            </p>
        </div>
      </div>

      {/* Decorative corner element */}
      <div className="absolute top-[-20%] left-[-20%] w-1/2 h-1/2 bg-white/5 blur-3xl rounded-full" />
    </motion.div>
  );
}
