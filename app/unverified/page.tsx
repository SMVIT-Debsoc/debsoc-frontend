"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Clock, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export default function UnverifiedPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-10 md:p-14 shadow-2xl max-w-lg w-full text-center relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            animate={{ 
              boxShadow: ["0 0 20px rgba(255,255,255,0)", "0 0 30px rgba(255,255,255,0.1)", "0 0 20px rgba(255,255,255,0)"] 
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-20 h-20 bg-white/[0.05] rounded-3xl flex items-center justify-center mb-8 border border-white/10"
          >
            <ShieldAlert className="text-white w-10 h-10 opacity-80" strokeWidth={1} />
          </motion.div>
          
          <h1 className="text-3xl font-extralight tracking-[0.2em] uppercase text-white mb-4">Verification Pending</h1>
          <p className="text-zinc-500 text-sm font-light leading-relaxed">
            Your account has been successfully created, but access is restricted until a <span className="text-white">Tech Head</span> manually verifies your identity.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/5 rounded-2xl text-left">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex-shrink-0 flex items-center justify-center">
              <Clock size={18} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-300">Expected Time</p>
              <p className="text-xs text-zinc-500 font-light">Verification typically takes 24-48 business hours.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/5 rounded-2xl text-left">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex-shrink-0 flex items-center justify-center">
              <Mail size={18} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-300">Need Help?</p>
              <p className="text-xs text-zinc-500 font-light">Contact the technical department if you believe this is an error.</p>
            </div>
          </div>
        </div>

        <Link 
          href="/"
          className="mt-12 group flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-medium"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Return to home
        </Link>
      </motion.div>
    </div>
  );
}
