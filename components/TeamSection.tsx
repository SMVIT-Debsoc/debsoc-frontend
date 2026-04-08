"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Grid3X3, Eye, Mic2, ChevronDown, Layers, Share2, FileText, Code, X, ArrowUpRight } from "lucide-react";

/* ─────────────────────────────────────────────
   Team data — randomly assigned to departments
   ───────────────────────────────────────────── */

interface Member {
  name: string;
  role: string;
  photo: string;
  isLead?: boolean;
}

interface Department {
  id: string;
  name: string;
  subtext: string;
  intro: string;
  icon: React.ReactNode;
  lead: Member;
  members: Member[];
}

const DEPARTMENTS: Department[] = [
  {
    id: "02",
    name: "Operational Core",
    subtext: "Logistics / Control / Deploy",
    intro: "Orchestrating the rhythm of discourse. Operational Core manages weekly sessions and flagship events like Axiom, DPL, and Literary Lane—successfully hosting landmark sessions for the community.",
    icon: <Zap size={16} className="text-zinc-400" />,
    lead: { name: "Dhruv Kumar", role: "Operational Lead", photo: "/media/DhruveKumar.jpg", isLead: true },
    members: [
      { name: "Rohan Singh", role: "Operational Lead", photo: "/media/RohanSingh.jpg" },
      { name: "Serojini Sarkar", role: "Operational Executive", photo: "/media/SerojiniSarkar.jpg" },
      { name: "Prachi Kumari", role: "Operational Executive", photo: "/media/PrachiKumari.jpg" },
      { name: "Piyush Ratn", role: "Operational Executive", photo: "/media/PiyushRatn.jpg" },
      { name: "Vishal", role: "Executive Member", photo: "/media/Vishal.jpg" },
      { name: "Srujan Rai", role: "Executive Member", photo: "/media/SrujanRai.jpg" },
      { name: "Nandini Sharma", role: "Executive Member", photo: "/media/NandiniSharma.jpg" },
      { name: "Kripa Chhajer", role: "Executive Member", photo: "/media/KripaChhajer.jpg" },
    ]
  },
  {
    id: "03",
    name: "Equity Alliance",
    subtext: "Guideline / Report / Resolve",
    intro: "This Equity Policy is instituted by the SMVIT Debating Society to ensure a respectful, inclusive, and safe environment. It operates as a foundational instrument of governance, predicated on the principle that debating, as an intellectual pursuit, must remain free from discrimination, harassment, or intimidation. Recognizing that inter-personal dynamics are shaped by pre-existing social structures, our core principles include Dignity and Equality, Accessibility, and Restorative Objectives. This policy applies uniformly to all members, adjudicators, and guests. Prohibited conduct includes bullying, vilification, sexual harassment, and the use of triggering language—focusing always on the impact of the conduct, regardless of intent.",
    icon: <Shield size={16} className="text-zinc-400" />,
    lead: { name: "Vittala Chaithanya", role: "Equity Head", photo: "/media/VittalaChaithanyaNM.jpg", isLead: true },
    members: [
      { name: "Mohammed Owais", role: "Equity Head", photo: "/media/MohammedOwais.jpg" },
      { name: "Nainika", role: "Equity Executive", photo: "/media/Nainika.jpg" },
      { name: "Advitiya Pandey", role: "Equity Member", photo: "/media/AdvitiyaPandey.jpg" },
      { name: "Stuti Padhi", role: "Equity Member", photo: "/media/StutiPadhi.jpg" },
    ]
  },
  {
    id: "04",
    name: "Tech Monolith",
    subtext: "Code / Build / Deploy",
    intro: "Engineering the digital stage for modern debate. We build the interfaces that bridge the gap between tradition and technology.",
    icon: <Code size={16} className="text-zinc-400" />,
    lead: { name: "Md Mobasshir Shakil Khan", role: "Tech Lead", photo: "/media/Mobii.jpg", isLead: true },
    members: []
  },
  {
    id: "05",
    name: "Social Sphere",
    subtext: "Aesthetic / Reach / Impact",
    intro: "Curating the global signal of DEBSOC. Our media team crafts the visual identity and narrative that defines our presence in the digital age.",
    icon: <Share2 size={16} className="text-zinc-400" />,
    lead: { name: "Ananya Singh", role: "Social Media Lead", photo: "/media/AnanyaSingh.jpg", isLead: true },
    members: [
      { name: "Pankhuri Singh", role: "Social Media Member", photo: "/media/PankhuriSingh.jpg" },
      { name: "Kanani Utsav", role: "Social Media Member", photo: "/media/KananiUtsav.jpg" }
    ]
  },
  {
    id: "06",
    name: "Content Engine",
    subtext: "Research / Write / Refine",
    intro: "Generating the raw fuel for argument. We distill complex global narratives into structured battlegrounds for intellectual combat.",
    icon: <FileText size={16} className="text-zinc-400" />,
    lead: { name: "Anika Gupta", role: "Content Head", photo: "/media/AnikaGupta.jpg", isLead: true },
    members: [
      { name: "Rishikesh Chandra", role: "Content Head", photo: "/media/RishikeshChandra.jpg" },
      { name: "Tanmay Shankar", role: "Content Member", photo: "/media/TanmayShankar.jpg" },
      { name: "Pranathi N P", role: "Content Member", photo: "/media/PranathiNP.jpg" },
      { name: "Mohammed Rayyan", role: "Content Member", photo: "/media/MohammedRayyanKhaleel.jpg" }
    ]
  }
];

const CURATORS: Member[] = [];

/* ─────────────────────────────────────────────
   Animated Section Wrapper
   ───────────────────────────────────────────── */

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        } ${className}`}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Department Section Component
   ───────────────────────────────────────────── */

function MemberCard({ member, size = "md", delay = 0, objectPosition = "center" }: { member: Member; size?: "lg" | "md" | "sm"; delay?: number; objectPosition?: string }) {
  const sizes = {
    lg: "text-lg md:text-2xl",
    md: "text-sm md:text-lg",
    sm: "text-[10px] md:text-sm"
  };

  return (
    <AnimatedSection delay={delay} className="group h-full min-h-0">
      <div className="relative w-full h-full overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-700">
        <div className="absolute inset-0 z-10">
          <div className="relative w-full h-full grayscale group-hover:grayscale-0 transition-all duration-1000">
            <Image
              src={member.photo}
              alt={member.name}
              fill
              className="object-cover"
              style={{ objectPosition }}
              sizes="30vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full z-20 p-2 md:p-4">
          <h3 className={`font-black uppercase tracking-tight leading-tight text-white ${sizes[size]}`}>
            {member.name}
          </h3>
          <span className="text-[7px] md:text-[9px] tracking-[0.2em] uppercase text-zinc-500 block mt-0.5 font-bold">
            {member.role}
          </span>
        </div>
      </div>
    </AnimatedSection>
  );
}

function DepartmentSection({ dept, id }: { dept: Department; id?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isOpCore = dept.name === "Operational Core";
  const isEquity = dept.name === "Equity Alliance";
  const isSpecialGrid = isOpCore || isEquity;
  
  const allMembers = [dept.lead, ...dept.members];

  // Grouping logic for hierarchy
  const leads = allMembers.filter(m => m.role.toLowerCase().includes("lead") || m.role.toLowerCase().includes("head"));

  // Executives (Middle tier)
  const executives = allMembers.filter(m =>
    m.role.toLowerCase().includes("executive") && !m.role.toLowerCase().includes("member")
  );
  
  // Members (Base tier)
  const regularMembers = allMembers.filter(m =>
    (m.role.toLowerCase().includes("member") || (isEquity && m.name === "Stuti Padhi")) && 
    !m.role.toLowerCase().includes("lead") && 
    !m.role.toLowerCase().includes("head")
  );

  const missionDirective = (
    <AnimatedSection 
      delay={150} 
      className={`relative group overflow-hidden transition-all flex flex-col justify-center border border-white/5 bg-white/[0.02] lg:hover:bg-white/[0.04]
        ${isEquity 
          ? 'flex-1 h-full p-4 md:p-6' 
          : 'flex-1 w-full max-w-3xl p-4 md:p-6 cursor-pointer'}`}
      onMouseEnter={() => setIsExpanded(true)}
    >
      <div className="flex justify-between items-center mb-2 md:mb-3 shrink-0">
        <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 group-hover:text-white/60 transition-colors">
          Mission Directive
        </h4>
        <ArrowUpRight size={14} className="text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
      </div>
      <div className="overflow-y-auto custom-scrollbar pr-2 min-h-0">
        <p className={`text-zinc-400 leading-relaxed font-light italic group-hover:text-white transition-colors ${isEquity ? 'text-[9px] md:text-[10px] lg:text-[11px]' : 'text-[11px] md:text-[13px]'}`}>
          "{dept.intro}"
        </p>
      </div>
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-white/10 group-hover:border-white/40 transition-colors" />
      <motion.div 
        className="absolute inset-0 bg-white/[0.01] -z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"
      />
    </AnimatedSection>
  );

  return (
    <section id={id} className="relative w-full h-screen py-8 px-6 md:px-12 overflow-hidden border-b border-white/[0.03] bg-[#050505] flex flex-col">
      {/* Immersive Overlay Explanation (Same as before) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 md:p-24"
            onMouseLeave={() => setIsExpanded(false)}
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="max-w-4xl w-full"
            >
              <div className="flex justify-between items-start mb-12">
                <h4 className="text-zinc-600 font-black uppercase tracking-[0.4em] text-xs">
                  Manifesto / {dept.name}
                </h4>
                <button onClick={() => setIsExpanded(false)} className="text-white/20 hover:text-white transition-colors">
                  <X size={32} />
                </button>
              </div>
              <h3 className="text-4xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-12">
                {isOpCore ? "Logistics. Control. Deploy." : isEquity ? "Guideline. Report. Resolve." : "Vision. Impact. Reach."}
              </h3>
              <p className="text-lg md:text-2xl text-zinc-400 font-light leading-relaxed mb-12 italic max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                {isOpCore 
                  ? "The Operational Core is the tactical heartbeat of the society. We bridge the gap between abstract planning and physical reality, orchestrating the complex logistics behind Axiom, DPL, and Literary Lane. Our directive is simple: perfect execution, unfailing reliability, and the successful deployment of every society event."
                  : isEquity 
                    ? dept.intro
                    : dept.intro
                }
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/5">
                {[
                  { label: "Core Principle", detail: isOpCore ? "Execution" : isEquity ? "Radical Inclusion" : "Excellence" },
                  { label: "Methodology", detail: isOpCore ? "Strategic Deployment" : isEquity ? "Conflict Resolution" : "Research" },
                  { label: "Goal", detail: isOpCore ? "Flawless Events" : isEquity ? "Ethical Excellence" : "Impact" }
                ].map((stat, i) => (
                  <div key={i}>
                    <span className="block text-[10px] uppercase tracking-widest text-zinc-600 mb-2">{stat.label}</span>
                    <p className="text-white font-medium italic">{stat.detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[10rem] md:text-[20rem] font-black text-white/[0.01] pointer-events-none select-none z-0">
        {dept.id}
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch mb-6 md:mb-8 z-10 shrink-0 gap-6 lg:gap-16">
        <AnimatedSection className="shrink-0 flex flex-col justify-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-[-0.05em] uppercase text-white">
            {dept.name}
          </h2>
          <span className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-zinc-600 font-bold block mt-1">
            {dept.subtext}
          </span>
        </AnimatedSection>
        
        {!isEquity && missionDirective}
      </div>

      <div className="flex-1 min-h-0 z-10 pb-4">
        {dept.name === "Social Sphere" ? (
          <div className="h-full flex gap-4 md:gap-6">
            <div className="w-[35%] md:w-[28%] lg:w-[22%] h-full shrink-0">
              {leads[0] && <MemberCard member={leads[0]} size="lg" delay={200} objectPosition="center" />}
            </div>
            <div className="w-[35%] md:w-[28%] lg:w-[22%] h-full flex flex-col gap-4 shrink-0">
              <div className="flex-1 min-h-0">
                {regularMembers[0] && <MemberCard member={regularMembers[0]} size="md" delay={300} objectPosition="center" />}
              </div>
              <div className="flex-1 min-h-0">
                {regularMembers[1] && <MemberCard member={regularMembers[1]} size="md" delay={400} objectPosition="bottom" />}
              </div>
            </div>
          </div>
        ) : isSpecialGrid ? (
          <div className="h-full flex gap-4 md:gap-6">
            {/* LEADS COLUMN (Vertical Stack - Reduced width to enforce portrait framing) */}
            <div className="w-[28%] md:w-[24%] lg:w-[20%] flex flex-col gap-4 shrink-0">
              <div className="flex-1 min-h-0">
                <MemberCard 
                  member={leads.find(m => m.name.includes("Dhruv") || m.name.includes("Vittala")) || leads[0]} 
                  size="lg" 
                  delay={200}
                  objectPosition="center 10%"
                />
              </div>
              <div className="flex-1 min-h-0">
                <MemberCard 
                  member={leads.find(m => m.name.includes("Rohan") || m.name.includes("Owais")) || leads[1]} 
                  size="lg" 
                  delay={400} 
                  objectPosition={(leads.find(m => m.name.includes("Rohan") || m.name.includes("Owais")) || leads[1]).name.includes("Rohan") ? "center" : "center 10%"}
                />
              </div>
            </div>

            {/* TEAM GRID (Flexible Remaining Space) */}
            <div className="flex-1 flex flex-col gap-4 md:gap-6">
              {/* EXECUTIVES SECTION (Bigger weight) */}
              <div className="flex-[1.5] min-h-0">
                <div className="h-full flex gap-4">
                  {executives.map((m, i) => (
                    <div key={m.name} className={`flex-1 h-full min-h-0 ${executives.length === 1 ? 'md:max-w-xs' : ''}`}>
                      <MemberCard 
                        member={m} 
                        size="md" 
                        delay={300 + i * 50} 
                        objectPosition="center 10%"
                      />
                    </div>
                  ))}
                  {isEquity && missionDirective}
                  {!isEquity && executives.length === 0 && <div className="flex-1 h-full bg-white/[0.01] border border-dashed border-white/5 flex items-center justify-center text-white/5 uppercase text-[9px] tracking-widest">Executive Tier</div>}
                </div>
              </div>

              {/* MEMBERS SECTION (Smaller weight) */}
              <div className="flex-1 min-h-0">
                <div className="h-full flex gap-3 md:gap-4 overflow-x-auto hide-scrollbar">
                  {regularMembers.map((m, i) => (
                    <div key={m.name} className="min-w-[140px] md:min-w-0 md:flex-1 h-full min-h-0">
                      <MemberCard 
                        member={m} 
                        size="sm" 
                        delay={500 + i * 50} 
                        objectPosition="center 10%"
                      />
                    </div>
                  ))}
                  {regularMembers.length < 4 && <div className="flex-1 hidden md:block" />}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-4">
            {leads.length > 0 && (
              <div className="flex-[1.8] flex gap-4">
                {leads.map((m, i) => <div key={m.name} className={`h-full ${leads.length === 1 ? 'w-[28%] md:w-[24%] lg:w-[20%] shrink-0' : 'flex-1'}`}><MemberCard member={m} size="lg" delay={200 + i * 50} objectPosition="center" /></div>)}
              </div>
            )}
            {executives.length > 0 && (
              <div className="flex-[1.2] flex gap-4">
                {executives.map((m, i) => <div key={m.name} className={`h-full ${executives.length === 1 ? 'w-[28%] md:w-[24%] lg:w-[20%] shrink-0' : 'flex-1'}`}><MemberCard member={m} size="md" delay={300 + i * 50} objectPosition="center 10%" /></div>)}
              </div>
            )}
            {regularMembers.length > 0 && (
              <div className="flex-1 flex gap-4">
                {regularMembers.map((m, i) => <div key={m.name} className={`h-full ${regularMembers.length < 4 ? 'w-[140px] md:w-[25%] lg:w-[20%] shrink-0' : 'flex-1'}`}><MemberCard member={m} size="sm" delay={400 + i * 50} objectPosition="center 10%" /></div>)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 opacity-20 hidden md:block">
        <span className="text-[10px] tracking-[0.5em] uppercase text-white font-black">
          FRAME_ID_{dept.id} // DEBSOC_MONOLITH
        </span>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */

interface TeamSectionProps {
  isTeamOpen: boolean;
  teamRef: React.RefObject<HTMLDivElement | null>;
}

export default function TeamSection({ isTeamOpen, teamRef }: TeamSectionProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      ref={teamRef}
      className={`absolute top-[200%] left-0 w-full h-screen overflow-y-auto bg-[#030303] flex flex-col z-50 text-white hide-scrollbar`}
    >
      {/* ─────────────────────────────────────────────
          SECTION 01 — THE ARCHITECT (President)
          ───────────────────────────────────────────── */}
      <section id="identity" className="relative w-full min-h-screen flex flex-col justify-end overflow-hidden border-b border-white/[0.05]">
        {/* Watermark Section Number */}
        <div className="absolute top-12 right-8 md:right-12 text-[8rem] md:text-[14rem] font-black text-white/[0.02] leading-none pointer-events-none select-none">
          01
        </div>

        {/* Navigation header */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-center p-8 md:px-12 z-30">
          <span className="text-[9px] md:text-xs tracking-[0.4em] uppercase text-zinc-500 font-light">
            Monolith / Roster / 2026
          </span>
          <div className="flex gap-8 text-[9px] md:text-xs tracking-[0.2em] uppercase text-zinc-600 font-light">
            <button onClick={() => scrollTo("identity")} className="text-white hover:text-white transition-colors cursor-pointer">Identity</button>
            <button onClick={() => scrollTo("ranks")} className="hover:text-white transition-colors cursor-pointer">Ranks</button>
            <button onClick={() => scrollTo("equity")} className="hover:text-white transition-colors cursor-pointer">Equity</button>
          </div>
        </div>

        {/* Main Spread */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 items-start justify-between w-full px-8 md:px-12 pb-16 md:pb-24 gap-12 z-10 relative lg:h-full min-h-[90vh]">

          {/* Left Column: Title + Aditya */}
          <div className="lg:col-span-7 pt-12 lg:pt-16 flex flex-col items-start w-full pr-12">
            <AnimatedSection delay={200}>
              <h1 className="text-[3.5rem] md:text-[5.5rem] lg:text-[7.5rem] font-black leading-none tracking-[-0.05em] uppercase pointer-events-none text-white mb-8">
                PRESIDENT
              </h1>
            </AnimatedSection>

            {/* ADITYA */}
            <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 mt-12">
              <AnimatedSection className="group shrink-0" delay={400}>
                <div className="relative w-44 h-64 md:w-80 md:h-[500px] overflow-hidden grayscale contrast-125 brightness-75 group-hover:grayscale-0 transition-all duration-1000 border border-white/5 shadow-2xl">
                  <Image
                    src="/media/AdityaKumarSingh.jpg"
                    alt="Vice President"
                    fill
                    className="object-cover"
                    sizes="600px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-95 shadow-[inset_0_-20px_40px_rgba(0,0,0,0.6)]" />

                  {/* Name Inside Photo */}
                  <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 text-left">
                    <h3 className="text-sm md:text-2xl font-black uppercase tracking-tight text-white leading-tight">
                      Aditya Kumar
                      <br />
                      Singh
                    </h3>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={500} className="flex flex-col pt-12 md:pt-16">
                <span className="text-[2.5rem] md:text-[4.5rem] lg:text-[6rem] font-black uppercase tracking-[-0.05em] text-white leading-[0.75] mb-4">
                  VICE
                  <br />
                  <span className="text-zinc-300">PRESIDENT</span>
                </span>
                <div className="w-16 h-[3px] bg-zinc-300/40 mb-2" />
              </AnimatedSection>
            </div>
          </div>

          {/* Right Column: KANISHK */}
          <div className="lg:col-span-5 w-full h-full flex flex-col justify-end lg:items-end">
            <AnimatedSection className="relative w-full max-w-[450px] aspect-[3/4.5] overflow-hidden grayscale contrast-125 brightness-90 shadow-2xl group lg:ml-auto" delay={400}>
              <div className="absolute inset-0 border border-white/10 z-20 pointer-events-none" />
              <Image
                src="/media/KanishkChaudhary.jpg"
                alt="President"
                fill
                className="object-cover scale-105 group-hover:scale-100 transition-transform duration-[2000ms] ease-out"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-80" />

              <div className="absolute bottom-12 right-10 text-right z-30">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-[-0.03em] leading-none text-white">
                  Kanishk
                  <br />
                  Chaudhary
                </h2>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Background Mic Mark */}
        <div className="absolute bottom-12 right-12 opacity-10 pointer-events-none">
          <Mic2 size={40} strokeWidth={1} className="text-white" />
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          DYNAMIC DEPARTMENT SECTIONS
          ───────────────────────────────────────────── */}
      <div id="ranks">
        {DEPARTMENTS.map((dept) => (
          <DepartmentSection key={dept.id} dept={dept} />
        ))}
      </div>

      {/* ─────────────────────────────────────────────
          SECTION 07 — INTERFACE CURATORS (Collective)
          ───────────────────────────────────────────── */}
      <section className="relative w-full py-32 px-8 md:px-12 bg-black/40">
        <AnimatedSection className="mb-24 text-center">
          <h2 className="text-2xl md:text-5xl font-black tracking-[-0.02em] uppercase mb-4">
            Interface Curators
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="w-8 h-[1px] bg-zinc-800" />
            <span className="text-[10px] tracking-[0.5em] uppercase text-zinc-700 italic">The Collective</span>
            <div className="w-8 h-[1px] bg-zinc-800" />
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
          {CURATORS.map((member, i) => (
            <AnimatedSection key={member.name} delay={i * 50} className="border-l border-white/5 pl-8">
              <div className="flex items-center gap-6 group hover:translate-x-2 transition-transform duration-500">
                <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 overflow-hidden rounded-full grayscale group-hover:grayscale-0 transition-all duration-700 border border-white/10">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">
                    {member.name}
                  </h4>
                  <span className="text-[9px] tracking-[0.3em] uppercase text-zinc-600 block mt-1">
                    System Operator
                  </span>
                  <div className="w-4 h-[1px] bg-zinc-800 mt-3 group-hover:w-8 transition-all" />
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          SECTION 08 — ETHICS & EQUITY (Footer)
          ───────────────────────────────────────────── */}
      <section id="equity" className="relative w-full py-40 px-8 md:px-12 flex flex-col items-center">
        <AnimatedSection className="max-w-4xl w-full text-center">
          <div className="mb-12 inline-block p-4 border border-white/5 bg-white/[0.01]">
            <Shield size={24} className="text-zinc-600" />
          </div>
          <h2 className="text-4xl md:text-7xl font-black tracking-[-0.05em] uppercase mb-8 leading-[0.9]">
            The Social
            <br />
            <span className="text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.3)] italic">Compass</span>
          </h2>
          <p className="text-zinc-600 text-sm md:text-lg font-light leading-relaxed max-w-xl mx-auto mb-16">
            Establishing the framework of radical inclusion.
            Ensuring the frequency of discourse remains ethical, balanced,
            and centered on collective growth.
          </p>

          <div className="flex flex-col sm:flex-row gap-12 items-center justify-center opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-300">Equity Program</span>
              <span className="text-[9px] tracking-[0.2em] uppercase text-zinc-600 mt-1">Status: Operational</span>
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-300">Safety Protocol</span>
              <span className="text-[9px] tracking-[0.2em] uppercase text-zinc-600 mt-1">Status: Active</span>
            </div>
          </div>
        </AnimatedSection>
      </section>

      <footer className="w-full py-12 px-8 md:px-12 border-t border-white/[0.03] flex flex-col md:flex-row justify-between items-center gap-8">
        <span className="text-[9px] tracking-[0.4em] uppercase text-zinc-700 font-light">
          © 2026 / SMVIT DEBSOC / Monolith v2
        </span>
        <div className="h-[1px] flex-1 bg-zinc-900 mx-8 hidden md:block" />
        <span className="text-[9px] tracking-[0.4em] uppercase text-zinc-700 font-light cursor-pointer hover:text-white transition-colors">
          Return to Identity
        </span>
      </footer>

    </div>
  );
}
