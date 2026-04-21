"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
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
          whileHover={{ rotate: 15, scale: 1.1 }}
          className="w-16 h-16 bg-white/[0.05] rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
        >
          <Sparkles className="text-white w-8 h-8" strokeWidth={1} />
        </motion.div>
        <h1 className="text-3xl font-extralight tracking-[0.25em] uppercase text-white mb-4">Welcome</h1>
        <p className="text-zinc-400 text-sm font-light max-w-[280px] mx-auto leading-relaxed">
          Access the Debsoc portal exclusively via your Google account.
        </p>
      </div>

      <div className="space-y-6">
        <button
          onClick={() => {
            const key = (document.getElementById("secret-key") as HTMLInputElement)?.value;
            if (key) {
              document.cookie = `debsoc_promotion_key=${key}; path=/; max-age=60; SameSite=Lax`;
            }
            signIn("google", { callbackUrl: "/dashboard" });
          }}
          className="group relative flex items-center justify-center gap-4 w-full bg-white text-black py-4 rounded-2xl font-medium overflow-hidden transition-all duration-500 hover:bg-zinc-200 active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.1)]"
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
          <span className="relative z-10 text-sm tracking-widest uppercase font-semibold">Sign in with Google</span>
          <ArrowRight size={18} className="relative z-10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </button>

        <div className="pt-4">
            <details className="group">
                <summary className="list-none cursor-pointer text-zinc-600 hover:text-zinc-400 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors flex items-center justify-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-zinc-800 group-open:bg-white transition-colors" />
                    Tech Head Elevation
                </summary>
                <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                    <p className="text-[10px] text-zinc-500 font-light leading-relaxed">
                        If you are an authorized administrator, enter your unique access key below before signing in.
                    </p>
                    <input
                        id="secret-key"
                        type="password"
                        placeholder="Master Access Key"
                        className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-3 px-6 text-zinc-400 placeholder:text-zinc-800 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all text-sm"
                    />
                </div>
            </details>
        </div>

        <p className="pt-4 text-zinc-700 text-[10px] uppercase tracking-[0.2em] font-medium">
          Secured by NextAuth
        </p>
      </div>

      {/* Decorative corner element */}
      <div className="absolute bottom-[-20%] right-[-20%] w-1/2 h-1/2 bg-white/5 blur-3xl rounded-full" />
    </motion.div>
  );
}
