"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <motion.div
      className="backdrop-blur-3xl bg-zinc-950/40 border border-white/10 shadow-[0_0_80px_-20px_rgba(79,70,229,0.3)] rounded-[2.5rem] p-8 sm:p-14 w-full relative overflow-hidden text-center"
    >
      {/* Internal Card Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-indigo-500/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />
      
      <div className="relative z-10 flex flex-col items-center mb-12">
        <motion.div 
          whileHover={{ rotate: 15, scale: 1.1 }}
          className="w-16 h-16 bg-white/[0.05] rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-md"
        >
          <Sparkles className="text-white w-8 h-8" strokeWidth={1.5} />
        </motion.div>
        <h1 className="text-[2.25rem] font-bold tracking-tighter uppercase mb-4 text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-white to-zinc-400">
          WELCOME BACK
        </h1>
        <p className="text-zinc-400 text-sm font-light max-w-[280px] mx-auto leading-relaxed">
          Access the Debsoc portal exclusively via your Google account.
        </p>
      </div>

      <div className="relative z-10 space-y-6">
        <button
          onClick={() => {
            const key = (document.getElementById("secret-key") as HTMLInputElement)?.value;
            if (key) {
              document.cookie = `debsoc_promotion_key=${key}; path=/; max-age=60; SameSite=Lax`;
            }
            signIn("google", { callbackUrl: "/dashboard" });
          }}
          className="group relative flex items-center justify-center gap-4 w-full bg-white text-black py-4 rounded-2xl font-semibold uppercase tracking-widest overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] text-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
          </svg>
          <span className="relative z-10">Sign in with Google</span>
          <ArrowRight size={18} className="relative z-10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </button>

        <div className="pt-4">
            <details className="group">
                <summary className="list-none cursor-pointer text-zinc-500 hover:text-white text-[10px] uppercase tracking-[0.2em] font-medium transition-colors flex items-center justify-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-zinc-700 group-open:bg-indigo-400 transition-colors" />
                    Tech Head Elevation
                </summary>
                <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                    <p className="text-[10px] text-zinc-400 font-light leading-relaxed">
                        If you are an authorized administrator, enter your unique access key below before signing in.
                    </p>
                    <input
                        id="secret-key"
                        type="password"
                        placeholder="Master Access Key"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-6 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm backdrop-blur-md"
                    />
                </div>
            </details>
        </div>

        <div className="pt-6">
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-medium text-center">
            Secured by NextAuth
          </p>
        </div>
      </div>
      
      {/* Decorative corner element */}
      <div className="absolute bottom-[-20%] right-[-20%] w-1/2 h-1/2 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
    </motion.div>
  );
}
