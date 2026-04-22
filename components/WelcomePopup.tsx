"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function WelcomePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only show on home page
    if (pathname !== "/") return;
    // Show popup after a short delay
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleNavigate = () => {
    setIsVisible(false);
    setTimeout(() => {
      router.push("/smvitpd");
    }, 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsDismissed(true);
      sessionStorage.setItem("pd_assistant_dismissed", "true");
    }, 300);
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm overflow-hidden"
          >
            {/* Minimalist Card Container */}
            <div className="relative bg-zinc-900/90 border border-white/10 rounded-2xl backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              {/* Scanline Effect (Subtle) */}
              <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,_rgba(255,255,255,0.02)_1px)] bg-[length:100%_4px] pointer-events-none" />
              
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="p-8 pt-10 text-center relative z-10">
                {/* Assistant Icon / Orb */}
                <div className="relative w-20 h-20 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-violet-500/30 rounded-full blur-xl animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="Debsoc Logo"
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Branding */}
                <h2 className="text-xs uppercase tracking-[0.4em] text-zinc-500 font-medium mb-2">
                  SMVIT PD
                </h2>
                <h3 className="text-3xl font-light text-white mb-1 tracking-tight">
                  Fultung
                </h3>
                <div className="h-[1px] w-8 bg-white/20 mx-auto mb-4" />
                
                <p className="text-zinc-400 text-sm font-light mb-8 max-w-[200px] mx-auto leading-relaxed">
                  Meet your <span className="text-white/80">PD Assistant</span> for optimized society management.
                </p>

                {/* Action Button */}
                <button
                  onClick={handleNavigate}
                  className="w-full py-4 rounded-xl text-[11px] font-medium text-white uppercase tracking-[0.2em] border border-white/20 bg-white/5 hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] backdrop-blur-md relative group overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Launch Assistant
                    <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Dismiss Link */}
                <button
                  onClick={handleDismiss}
                  className="mt-6 text-[10px] uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}