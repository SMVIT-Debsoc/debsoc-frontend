"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Shield, Zap, Grid3X3, Eye, Mic2, ChevronDown, Layers, Share2, FileText, Code } from "lucide-react";

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
    intro: "Orchestrating the rhythm of discourse. Our operational wing ensures the infrastructure of debate remains monolithic and unyielding.",
    icon: <Zap size={16} className="text-zinc-400" />,
    lead: { name: "Aditya Kumar Singh", role: "Vice President", photo: "/media/AdityaKumarSingh.jpg", isLead: true },
    members: [
      { name: "Dhruv Kumar", role: "Operational Head", photo: "/media/DhruveKumar.jpg" },
      { name: "Rohan Singh", role: "Operational Head", photo: "/media/RohanSingh.jpg" },
    ]
  },
  {
    id: "03",
    name: "Equity Alliance",
    subtext: "Guideline / Report / Resolve",
    intro: "Protecting the intellectual sanctuary. The equity team maintains the standard of radical inclusion and ethical engagement across all sessions.",
    icon: <Shield size={16} className="text-zinc-400" />,
    lead: { name: "Stuti Padhi", role: "Equity Lead", photo: "/media/StutiPadhi.jpg", isLead: true },
    members: [
      { name: "Srujan Rai", role: "Equity Officer", photo: "/media/SrujanRai.jpg" },
      { name: "Nainika", role: "Equity Officer", photo: "/media/Nainika.jpg" },
    ]
  },
  {
    id: "04",
    name: "Tech Monolith",
    subtext: "Code / Build / Deploy",
    intro: "Engineering the digital stage for modern debate. We build the interfaces that bridge the gap between tradition and technology.",
    icon: <Code size={16} className="text-zinc-400" />,
    lead: { name: "Mobashir", role: "Tech Lead", photo: "/media/Mobii.jpg", isLead: true },
    members: [
      { name: "Vittala Chaithanya", role: "Lead Engineer", photo: "/media/VittalaChaithanyaNM.jpg" },
      { name: "Kanani Utsav", role: "Frontend Dev", photo: "/media/KananiUtsav.jpg" },
    ]
  },
  {
    id: "05",
    name: "Social Sphere",
    subtext: "Aesthetic / Reach / Impact",
    intro: "Curating the global signal of DEBSOC. Our media team crafts the visual identity and narrative that defines our presence in the digital age.",
    icon: <Share2 size={16} className="text-zinc-400" />,
    lead: { name: "Mohammed Owais", role: "Media Head", photo: "/media/MohammedOwais.jpg", isLead: true },
    members: [
      { name: "Prachi Kumari", role: "Creative Lead", photo: "/media/PrachiKumari.jpg" },
      { name: "Ananya Singh", role: "Digital Stylist", photo: "/media/AnanyaSingh.jpg" },
    ]
  },
  {
    id: "06",
    name: "Content Engine",
    subtext: "Research / Write / Refine",
    intro: "Generating the raw fuel for argument. We distill complex global narratives into structured battlegrounds for intellectual combat.",
    icon: <FileText size={16} className="text-zinc-400" />,
    lead: { name: "Nandini Sharma", role: "Content Head", photo: "/media/NandiniSharma.jpg", isLead: true },
    members: [
      { name: "Anika Gupta", role: "Lead Researcher", photo: "/media/AnikaGupta.jpg" },
      { name: "Advitiya Pandey", role: "Editorial Head", photo: "/media/AdvitiyaPandey.jpg" },
    ]
  }
];

const CURATORS = [
  { name: "Pankhuri Singh", role: "Member", photo: "/media/PankhuriSingh.jpg" },
  { name: "Piyush Ratn", role: "Member", photo: "/media/PiyushRatn.jpg" },
  { name: "Pranathi N P", role: "Member", photo: "/media/PranathiNP.jpg" },
  { name: "Rishikesh Chandra", role: "Member", photo: "/media/RishikeshChandra.jpg" },
  { name: "Serojini Sarkar", role: "Member", photo: "/media/SerojiniSarkar.jpg" },
  { name: "Tanmay Shankar", role: "Member", photo: "/media/TanmayShankar.jpg" },
  { name: "Vishal", role: "Member", photo: "/media/Vishal.jpg" },
  { name: "Mohammed Rayyan", role: "Member", photo: "/media/MohammedRayyanKhaleel.jpg" },
  { name: "Kripa Chhajer", role: "Member", photo: "/media/KripaChhajer.jpg" },
];

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
      className={`transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Department Section Component
   ───────────────────────────────────────────── */

function DepartmentSection({ dept, id }: { dept: Department; id?: string }) {
  return (
    <section id={id} className="relative w-full py-24 md:py-32 px-8 md:px-12 overflow-hidden border-b border-white/[0.03]">
      {/* Watermark Section Number */}
      <div className="absolute top-12 right-8 md:right-12 text-[8rem] md:text-[14rem] font-black text-white/[0.02] leading-none pointer-events-none select-none">
        {dept.id}
      </div>

      <AnimatedSection>
        <h2 className="text-3xl md:text-5xl lg:text-7xl font-black tracking-[-0.04em] uppercase mb-1">
          {dept.name}
        </h2>
        <span className="text-[10px] tracking-[0.4em] uppercase text-zinc-600 block mb-20 italic">
          {dept.subtext}
        </span>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 relative z-10">
        {/* Left Aspect: Lead Photo (Big) */}
        <div className="md:col-span-6 lg:col-span-5 relative group">
          <AnimatedSection delay={200}>
            <div className="relative aspect-[3/4] overflow-hidden grayscale contrast-110 brightness-90 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000 ease-out">
              <Image
                src={dept.lead.photo}
                alt={dept.lead.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-6 left-6">
                <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight">
                  {dept.lead.name}
                </h3>
                <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 block mt-1">
                  {dept.lead.role}
                </span>
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* Right Aspect: Members + Info Box */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-col justify-between">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Intro Box */}
            <AnimatedSection delay={400} className="w-full md:w-[320px] bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-8 relative">
              <div className="mb-6">{dept.icon}</div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white mb-3">
                Core Directive
              </h4>
              <p className="text-zinc-500 text-xs leading-relaxed font-light">
                {dept.intro}
              </p>
              {/* Decorative line */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10" />
            </AnimatedSection>

            {/* Members Grid (Small photos) */}
            <div className="grid grid-cols-2 gap-4 flex-1">
              {dept.members.map((member, i) => (
                <AnimatedSection key={member.name} delay={600 + i * 150}>
                  <div className="group">
                    <div className="relative aspect-[4/5] overflow-hidden mb-3 grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700">
                      <Image
                        src={member.photo}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest">{member.name}</h5>
                    <span className="text-[9px] tracking-[0.2em] uppercase text-zinc-600 italic">{member.role}</span>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>

          {/* Bottom decorative text: THE GRID style */}
          <AnimatedSection delay={800} className="mt-12 md:mt-0">
            <div className="flex items-center gap-6">
              <div className="h-[1px] w-12 bg-zinc-800" />
              <div>
                <span className="text-4xl md:text-6xl font-black uppercase tracking-[-0.05em] text-white/[0.03] select-none">
                  THE SYSTEM FLOW
                </span>
              </div>
            </div>
          </AnimatedSection>
        </div>
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

        {/* Tier label */}
        <AnimatedSection className="absolute top-24 left-8 md:left-12 z-20">
          <span className="text-[10px] tracking-[0.5em] uppercase text-zinc-700 block mb-3">
            Presidential Anchor
          </span>
          <div className="w-12 h-[1px] bg-zinc-800" />
        </AnimatedSection>

        {/* Hero Content */}
        <div className="flex flex-col md:flex-row items-end justify-between w-full px-8 md:px-12 pb-16 md:pb-24 gap-12 z-10 relative">
          <AnimatedSection className="flex-1 max-w-3xl" delay={200}>
            <h1 className="text-[5rem] md:text-[9.5rem] lg:text-[12rem] font-black leading-[0.85] tracking-[-0.05em] uppercase pointer-events-none">
              THE
              <br />
              <span className="text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.4)]">
                ARCHITECT
              </span>
            </h1>
            <p className="text-zinc-600 text-xs md:text-sm font-light leading-relaxed mt-10 max-w-sm">
              Governing the monolithic structure of SMVIT DEBSOC. 
              Engineering the second century of discourse through radical architecture and unyielding logic.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="w-12 h-[1px] bg-zinc-800" />
              <span className="text-[9px] tracking-[0.4em] uppercase text-zinc-500">
                KANISHK CHAUDHARY
              </span>
            </div>
          </AnimatedSection>

          <AnimatedSection className="relative w-full md:w-[400px] lg:w-[480px] aspect-[1/1.2] flex-shrink-0" delay={400}>
            <div className="absolute inset-0 overflow-hidden grayscale contrast-125 brightness-90 shadow-2xl">
              <div className="absolute inset-0 border border-white/5 z-20" />
              <Image
                src="/media/KanishkChaudhary.jpg"
                alt="President"
                fill
                className="object-cover"
                priority
                sizes="500px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-80" />
            </div>
            
            {/* Subtle floating label */}
            <div className="absolute top-1/2 -left-12 -rotate-90 origin-left">
              <span className="text-[9px] tracking-[0.6em] uppercase text-zinc-800">
                DIRECTIVE / 01
              </span>
            </div>
          </AnimatedSection>
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
