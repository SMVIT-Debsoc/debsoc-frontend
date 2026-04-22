"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  Users, 
  Star,
  ChevronRight
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-3xl bg-zinc-950/40 border border-white/10 shadow-[0_0_80px_-20px_rgba(255,255,255,0.1)] rounded-[2.5rem] p-6 sm:p-10 w-full relative overflow-hidden"
    >
      {/* Internal Card Glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b ${mode === 'login' ? 'from-indigo-500/10' : 'from-rose-500/10'} to-transparent blur-3xl pointer-events-none transition-colors duration-700`} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Mode Switcher */}
      <div className="relative z-10 flex p-1.5 bg-white/[0.03] border border-white/5 rounded-2xl mb-10">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 py-2.5 rounded-xl text-[11px] uppercase tracking-widest font-medium transition-all duration-300 relative ${mode === 'login' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {mode === 'login' && (
            <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/[0.08] border border-white/10 rounded-xl" />
          )}
          <span className="relative z-10">Sign In</span>
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 py-2.5 rounded-xl text-[11px] uppercase tracking-widest font-medium transition-all duration-300 relative ${mode === 'signup' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {mode === 'signup' && (
            <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/[0.08] border border-white/10 rounded-xl" />
          )}
          <span className="relative z-10">Join Us</span>
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center mb-8 text-center">
        <motion.div 
          key={mode}
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          className="w-14 h-14 bg-white/[0.03] rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-inner backdrop-blur-md"
        >
          {mode === 'login' ? (
            <Sparkles className="text-indigo-400 w-7 h-7" strokeWidth={1.5} />
          ) : (
            <ShieldCheck className="text-rose-400 w-7 h-7" strokeWidth={1.5} />
          )}
        </motion.div>
        
        <h1 className="text-3xl font-bold tracking-tight uppercase mb-3 text-white">
          {mode === 'login' ? "Welcome Back" : "Start Journey"}
        </h1>
        <p className="text-zinc-400 text-sm font-light max-w-[280px] mx-auto leading-relaxed">
          {mode === 'login' 
            ? "Access the Debsoc portal exclusively via your Google account." 
            : "Create your profile to join the most elite intellectual society."}
        </p>
      </div>

      <div className="relative z-10 space-y-6">
        <AnimatePresence mode="wait">
          {mode === "signup" ? (
            <motion.div
              key="signup-fields"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Role Selection */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium ml-1 block">Role Preference</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "Member", icon: User, label: "Member" },
                    { id: "cabinet", icon: Users, label: "Cabinet" },
                    { id: "President", icon: Star, label: "President" }
                  ].map((roleType) => (
                    <button
                      key={roleType.id}
                      onClick={() => setSelectedRole(roleType.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all duration-300 ${
                        selectedRole === roleType.id 
                          ? "bg-white/[0.08] border-rose-500/40 text-white shadow-[0_0_20px_rgba(244,63,94,0.1)]" 
                          : "bg-white/[0.01] border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300"
                      }`}
                    >
                      <roleType.icon size={18} className={selectedRole === roleType.id ? "text-rose-400" : ""} />
                      <span className="text-[9px] uppercase tracking-wider font-medium">{roleType.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedRole === "cabinet" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden"
                >
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Cabinet Position (e.g. Secretary)"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-6 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/30 transition-all text-sm"
                  />
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="login-fields"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
               <details className="group">
                  <summary className="list-none cursor-pointer text-zinc-600 hover:text-zinc-400 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors flex items-center justify-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-zinc-800 group-open:bg-indigo-400 transition-colors" />
                      Administrator Access
                  </summary>
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      <input
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          type="password"
                          placeholder="Master Access Key"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-6 text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/30 transition-all text-sm"
                      />
                  </div>
              </details>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleAuth}
          className={`group relative flex items-center justify-center gap-4 w-full ${mode === 'login' ? 'bg-white text-black' : 'bg-rose-600 text-white'} py-4 rounded-2xl font-bold uppercase tracking-[0.2em] overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] text-[11px]`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
            <path fill={mode === 'login' ? "#4285F4" : "#fff"} d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill={mode === 'login' ? "#34A853" : "#fff"} d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill={mode === 'login' ? "#FBBC05" : "#fff"} d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill={mode === 'login' ? "#EA4335" : "#fff"} d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
          </svg>
          <span className="relative z-10">{mode === 'login' ? "Continue with Google" : "Join with Google"}</span>
          <ChevronRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="pt-4 text-center">
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            {mode === 'login' ? "New member? Join Debsoc" : "Already have an account? Sign In"}
          </button>
        </div>

        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-zinc-700 text-[9px] uppercase tracking-[0.3em] font-medium mb-2">
            Secure Authentication
          </p>
          <div className="flex justify-center gap-4 text-zinc-600">
             <span className="text-[8px] uppercase tracking-widest">NextAuth 5.0</span>
             <span className="text-[8px] uppercase tracking-widest">Google Cloud</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
