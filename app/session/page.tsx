"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Navbar from "@/components/Navbar";
import toast, { Toaster } from "react-hot-toast";
import { 
  Sparkles, RefreshCw, Info, ChevronRight, BookOpen, Layers, 
  Users, Zap, Timer, PenTool, Hash, Target, ChevronDown 
} from "lucide-react";
import { motionData, MotionItem } from "@/lib/motion";

const getRandomMotions = (count = 1) => {
  const shuffled = [...motionData].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, motionData.length));
};

export default function Session() {
  const [motions, setMotions] = useState<MotionItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const bgtxtY = useTransform(scrollYProgress, [0, 1], [0, -500]);

  useEffect(() => {
    setMotions(getRandomMotions());
  }, []);

  const handleNewMotion = async () => {
    setIsGenerating(true);
    const loadNewMotion = new Promise((resolve) => {
      setTimeout(() => {
        const newMotions = getRandomMotions();
        setMotions(newMotions);
        setIsGenerating(false);
        resolve(newMotions);
      }, 1200);
    });

    toast.promise(
      loadNewMotion,
      {
        loading: "Synthesizing discourse...",
        success: "Motion generated.",
        error: "Interference detected.",
      },
      {
        style: {
          borderRadius: "0px",
          background: "#09090b",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
        },
      }
    );
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-zinc-400 font-sans selection:bg-white selection:text-black overflow-x-hidden">
      <Toaster position="bottom-right" />
      <Navbar />

      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <div className="absolute top-0 left-1/4 w-px h-full bg-white/5" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-white/5" />
        <motion.div 
          style={{ y: bgtxtY }}
          className="absolute -right-20 top-40 text-[20rem] font-black text-white/[0.02] uppercase leading-none select-none origin-center rotate-90"
        >
          Session
        </motion.div>
      </div>

      <main className="relative z-10 pt-48 pb-40 px-6 md:px-12 max-w-7xl mx-auto space-y-64">
        
        {/* HERO: DYNAMIC MOTION LAB */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20">
          <div className="absolute inset-0 flex items-center justify-center -z-10">
            <div className="w-[1000px] h-[1000px] bg-zinc-900/40 blur-[200px] rounded-full" />
          </div>

          <div className="w-full flex flex-col items-center text-center space-y-16">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6 relative"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-zinc-800" />
                <span className="text-zinc-500 font-light tracking-[0.6em] uppercase text-[9px]">Argumentation Forge</span>
                <div className="h-px w-12 bg-zinc-800" />
              </div>
              <h1 className="text-6xl md:text-9xl font-light tracking-tighter text-white uppercase italic leading-none relative z-10">
                Motion <span className="text-zinc-600 not-italic">Engine</span>
              </h1>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-black text-white/[0.01] uppercase leading-none select-none -z-10 pointer-events-none">
                Lab
              </div>
            </motion.div>

            <div className="w-full max-w-5xl relative px-4">
              <div className="absolute -top-16 -left-4 md:-left-16 text-white/[0.03] font-mono text-[10rem] select-none leading-none">01</div>
              
              <AnimatePresence mode="wait">
                {motions.length > 0 ? (
                  <motion.div
                    key={motions[0].motion}
                    initial={{ opacity: 0, scale: 0.98, filter: "blur(15px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.02, filter: "blur(15px)" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-8 md:p-20 rounded-sm shadow-[0_0_150px_rgba(0,0,0,0.8)] overflow-hidden"
                  >
                    {/* Glassmorphism edges */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="absolute bottom-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                    
                    <div className="relative z-10 space-y-12">
                      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8">
                        <div className="flex items-center gap-4">
                          <span className="px-5 py-2 bg-white text-black text-[9px] uppercase tracking-[0.2em] font-bold rounded-full">
                            {motions[0].types.split(' ')[0]}
                          </span>
                          <div className="h-4 w-px bg-white/10" />
                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest italic">
                            Verified Protocol
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                           <span className="text-[8px] text-zinc-600 uppercase tracking-widest font-mono">System Active</span>
                        </div>
                      </div>
                      
                      <h3 className="text-3xl md:text-5xl lg:text-6xl font-light text-white leading-tight tracking-tight max-w-4xl mx-auto italic">
                        "{motions[0].motion}"
                      </h3>

                      <div className="pt-12 grid md:grid-cols-4 gap-12 items-end">
                        <div className="md:col-span-3 space-y-4 text-left">
                          <div className="flex items-center gap-3 text-zinc-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                            <span className="text-[9px] uppercase tracking-[0.4em] font-bold">Concept Context</span>
                          </div>
                          <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-light italic opacity-80 border-l border-white/10 pl-6">
                            {motions[0].InfoSlide || "No supplemental data available for this sequence."}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-6">
                           <div className="text-right space-y-2">
                              <p className="text-[8px] text-zinc-600 uppercase tracking-[0.4em]">Complexity Analysis</p>
                              <div className="flex gap-1.5 justify-end">
                                {[1,2,3,4,5].map(i => (
                                  <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`w-4 h-1 rounded-full ${i <= 3 ? 'bg-white/40' : 'bg-white/5'}`} 
                                  />
                                ))}
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center gap-6">
                    <div className="w-16 h-16 border-2 border-white/5 border-t-white animate-spin rounded-full" />
                    <span className="text-[10px] text-zinc-600 uppercase tracking-[0.8em] animate-pulse">Initializing Database</span>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#fff", color: "#000" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewMotion}
                disabled={isGenerating}
                className="flex items-center gap-4 px-12 py-5 border border-white/10 text-white text-[10px] uppercase tracking-[0.4em] font-medium transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
                Initialize Sequence
              </motion.button>
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Algorithm Optimized for 2024 Meta</p>
            </div>
          </div>
        </section>

        {/* SECTION: THE PROTOCOLS (FORMATS) */}
        <section className="space-y-32">
          <div className="flex flex-col items-center text-center space-y-6">
             <div className="px-4 py-1 bg-white/5 border border-white/10 text-[9px] text-zinc-500 uppercase tracking-[0.4em]">The Protocols</div>
             <h2 className="text-4xl md:text-6xl font-light text-white uppercase italic tracking-tighter">Debate <span className="text-zinc-600 not-italic">Mechanics</span></h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-px bg-white/5 border border-white/10 overflow-hidden">
            {/* BP FORMAT */}
            <div className="group relative bg-[#070707] p-12 md:p-20 space-y-12 hover:bg-[#0a0a0a] transition-all duration-700">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-white/0 group-hover:bg-white/20 transition-all" />
              <img 
                src="https://images.unsplash.com/photo-1541872703-74c5e443d1f5?q=80&w=2000&auto=format&fit=crop" 
                alt="BP" 
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-[0.03] transition-opacity duration-1000 scale-105 group-hover:scale-100"
              />
              
              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                    <Timer size={28} strokeWidth={1} />
                  </div>
                  <span className="text-[60px] font-black text-white/[0.03]">BP</span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-3xl text-white font-light uppercase tracking-widest italic leading-none">British <span className="text-zinc-600 not-italic">Parliamentary</span></h3>
                  <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
                    The vertical challenge. Two teams on each side, competing both against the opposition and their partners for the best extension.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-10 pt-10 border-t border-white/5">
                  <div className="space-y-2">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Preparation</p>
                    <p className="text-xl text-white font-light tracking-tight italic">15 Minutes <span className="text-zinc-600 text-xs">Fixed</span></p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Participant Load</p>
                    <p className="text-xl text-white font-light tracking-tight italic">08 <span className="text-zinc-600 text-xs">Speakers</span></p>
                  </div>
                </div>

                <div className="space-y-6">
                   <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Dynamic Speaker Order</p>
                   <div className="flex flex-wrap gap-2">
                      {["PM","LO","DPM","DLO","MG","MO","GW","OW"].map((s, i) => (
                        <div key={s} className="px-3 py-1.5 bg-white/5 border border-white/5 text-[9px] text-zinc-400 font-mono">
                          {String(i+1).padStart(2, '0')} {s}
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            {/* ASIAN FORMAT */}
            <div className="group relative bg-[#070707] p-12 md:p-20 space-y-12 hover:bg-[#0a0a0a] transition-all duration-700">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-white/0 group-hover:bg-white/20 transition-all" />
              <img 
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2000&auto=format&fit=crop" 
                alt="AP" 
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-[0.03] transition-opacity duration-1000 scale-105 group-hover:scale-100"
              />

              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                    <Users size={28} strokeWidth={1} />
                  </div>
                  <span className="text-[60px] font-black text-white/[0.03]">AP</span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-3xl text-white font-light uppercase tracking-widest italic leading-none">Asian <span className="text-zinc-600 not-italic">Parliamentary</span></h3>
                  <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
                    The classic confrontation. 3v3 focus on internal consistency, deep logical layers, and devastating reply speeches.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-10 pt-10 border-t border-white/5">
                  <div className="space-y-2">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Preparation</p>
                    <p className="text-xl text-white font-light tracking-tight italic">30 Minutes <span className="text-zinc-600 text-xs">Total</span></p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Reply Phase</p>
                    <p className="text-xl text-white font-light tracking-tight italic">04 <span className="text-zinc-600 text-xs">Minutes</span></p>
                  </div>
                </div>

                <div className="space-y-6">
                   <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Standard Speeches</p>
                   <div className="flex flex-wrap gap-2 text-zinc-500 text-[10px] items-center">
                      <span>PM</span> <ChevronRight size={10} />
                      <span>LO</span> <ChevronRight size={10} />
                      <span>DPM</span> <ChevronRight size={10} />
                      <span>DLO</span> <ChevronRight size={10} />
                      <span>GW</span> <ChevronRight size={10} />
                      <span>OW</span> 
                      <div className="w-1 h-4 bg-white/10 mx-2" />
                      <span className="text-white/60">Reply Speeches (Opp → Gov)</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: STRATEGY NODES */}
        <section className="relative py-20 px-10 bg-zinc-900/10 border border-white/5 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full overflow-hidden opacity-20 transform translate-x-10">
             <div className="w-full h-full bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />
          </div>
          
          <div className="flex flex-col md:flex-row items-start justify-between gap-20">
             <div className="md:w-1/3 space-y-8">
               <div className="space-y-4">
                 <p className="text-[10px] text-zinc-600 uppercase tracking-[0.4em] font-bold">02 Core Theory</p>
                 <h2 className="text-4xl text-white font-light uppercase tracking-tighter leading-tight italic">Strategic <br /> <span className="text-zinc-600 not-italic">Foundation</span></h2>
               </div>
               <p className="text-sm text-zinc-500 leading-relaxed font-light">
                 Debate is won in the prep room. Understanding these three pillars ensures you are debating from a position of authority, not reaction.
               </p>
               <div className="pt-8">
                  <div className="w-12 h-px bg-white/20" />
               </div>
             </div>

             <div className="md:w-2/3 grid md:grid-cols-1 gap-px bg-white/5 border border-white/10">
                {[
                  { icon: <Zap />, title: "POI Integration", desc: "Points of Information should not be random questions. They are strategic interventions meant to force a speaker into a logical binary or reveal a lack of structural nuance." },
                  { icon: <Layers />, title: "The Mechanism Layer", desc: "In 'THW' motions, your mechanism is your shield. Define the implementation detail to pre-empt 'Does not work' arguments and control the debate's environment." },
                  { icon: <Target />, title: "Fiat Equilibrium", desc: "Both sides possess equal Fiat. If the Gov can claim they pass a law, the Opp can claim they implement an alternative policy with the same degree of executive power." }
                ].map((item, i) => (
                  <div key={i} className="group bg-[#080808] p-10 flex gap-8 hover:bg-zinc-900/20 transition-colors">
                    <div className="text-zinc-600 group-hover:text-white transition-colors pt-1">
                      {item.icon}
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-lg text-white font-light uppercase tracking-widest">{item.title}</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-300 transition-colors max-w-xl">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* SECTION: MOTION TAXONOMY */}
        <section className="space-y-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-10">
            <div className="space-y-4">
              <p className="text-[10px] text-zinc-600 uppercase tracking-[0.4em] font-bold">03 Taxonomy</p>
              <h2 className="text-4xl md:text-7xl font-light text-white uppercase italic tracking-tighter">Motion <span className="text-zinc-600 not-italic">Classification</span></h2>
            </div>
            <p className="max-w-xs text-[10px] text-zinc-600 uppercase tracking-widest leading-relaxed text-right">
              Different burdens for different battlegrounds. Identify the motion type to win the clash.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {[
              { tag: "THBT", title: "Believes That", desc: "Analysis of values, trends, or facts. No mechanism required. Focus on the 'Truth' of the claim." },
              { tag: "THW", title: "This House Would", desc: "Action-oriented. Requires a clear model. Focus on consequences and the 'Should' of implementation." },
              { tag: "THR", title: "This House Regrets", desc: "A world without X. Compare reality with a specific counterfactual alternative. Evaluate past impacts." },
              { tag: "THS", title: "This House Supports", desc: "Moral or pragmatic alignment with a trend. You take the reputation of the side you support." },
              { tag: "TH, as X", title: "Actor Perspectives", desc: "Incentive-based. Argue purely from the best interests of 'X', regardless of global morality." },
              { tag: "THO", title: "This House Opposes", desc: "The antithesis of support. Often used for existing virtue-signalling or specific cultural trends." }
            ].map((type) => (
              <div key={type.tag} className="bg-black p-12 group hover:bg-[#0a0a0a] transition-all duration-500 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-[100px] font-black text-white/[0.01] group-hover:text-white/[0.03] transition-colors">{type.tag}</div>
                <div className="relative z-10 space-y-6">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-[0.4em] mb-4 group-hover:text-white transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-white" />
                    {type.tag}
                  </div>
                  <h4 className="text-2xl text-white font-light group-hover:italic transition-all">{type.title}</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed group-hover:text-zinc-300 transition-colors">
                    {type.desc}
                  </p>
                  <motion.div whileHover={{ x: 5 }} className="pt-4 flex items-center gap-2 text-[8px] text-zinc-700 group-hover:text-zinc-400 uppercase tracking-widest cursor-pointer">
                    View Strategic Playbook <ChevronRight size={10} />
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: PREP CHECKLIST */}
        <section className="grid md:grid-cols-2 gap-20 p-20 bg-zinc-900/5 border border-white/5">
           <div className="space-y-10">
              <div className="space-y-4">
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.4em] font-bold">04 Preparation</p>
                <h2 className="text-4xl text-white font-light uppercase italic">Strategic <span className="not-italic text-zinc-600">Checklist</span></h2>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed font-light">
                Follow these protocols in the first 5 minutes of your preparation to ensure a robust structural case.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-bold">Recommended Workflow</span>
              </div>
           </div>
           
           <div className="space-y-6">
              {[
                { label: "Define the Burden", detail: "What exactly do we need to prove to win this specific round?" },
                { label: "Actor Mapping", detail: "Identify primary and secondary actors involved in the motion's ecosystem." },
                { label: "Comparative Analysis", detail: "What does the world look like on both sides? Be honest about tradeoffs." },
                { label: "Characterization", detail: "Set the environment. How do people feel? What are the pressures?" }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                   <div className="text-[10px] font-mono text-zinc-700 mt-1">{String(i+1).padStart(2, '0')}</div>
                   <div className="space-y-1">
                      <p className="text-xs text-white uppercase tracking-widest font-medium">{item.label}</p>
                      <p className="text-[11px] text-zinc-600">{item.detail}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* FOOTER CALL TO ACTION */}
        <section className="pt-20 pb-40 text-center relative">
          <div className="absolute inset-0 flex items-center justify-center -z-10">
             <div className="w-[1000px] h-[500px] bg-white/[0.02] blur-[150px] rounded-full" />
          </div>
          
          <div className="max-w-2xl mx-auto space-y-12">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-light text-white uppercase tracking-widest leading-tight italic">
                Master the <span className="not-italic text-zinc-400">Microphone</span>
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed uppercase tracking-widest">
                "Logic is the beginning of wisdom, not the end." — Spock
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-8">
               <motion.div 
                 initial={{ width: 0 }}
                 whileInView={{ width: "100px" }}
                 className="h-px bg-white/20" 
               />
               <motion.a
                href="/"
                whileHover={{ y: -5, color: "#fff" }}
                className="group flex flex-col items-center gap-4 text-[10px] text-zinc-500 uppercase tracking-[0.5em] transition-all"
              >
                Return to Station
                <div className="w-1 h-1 bg-zinc-800 rounded-full group-hover:scale-[3] group-hover:bg-white transition-all duration-500" />
              </motion.a>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 border-t border-white/5 flex flex-col items-center gap-4 relative z-10">
         <div className="flex items-center gap-2 opacity-20">
            <Sparkles size={12} />
            <span className="text-[8px] uppercase tracking-[0.5em]">SMVIT DEBSOC SYSTEM v2.0</span>
         </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
        }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
