"use client";

import React, {useEffect, useRef, useState} from "react";
import Image from "next/image";
import {motion} from "framer-motion";
import {
    Shield,
    Zap,
    Grid3X3,
    Eye,
    Mic2,
    ChevronDown,
    Layers,
    Share2,
    FileText,
    Code,
    ArrowUpRight,
} from "lucide-react";

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
        lead: {
            name: "Dhruv Kumar",
            role: "Operational Lead",
            photo: "/media/DhruveKumar.jpg",
            isLead: true,
        },
        members: [
            {
                name: "Rohan Singh",
                role: "Operational Lead",
                photo: "/media/RohanSingh.jpg",
            },
            {
                name: "Srejoni Sarkar",
                role: "Operational Executive",
                photo: "/media/SSerojiniSarkar.jpg",
            },
            {
                name: "Prachi Kumari",
                role: "Operational Executive",
                photo: "/media/PrachiKumari.jpg",
            },
            {
                name: "Piyush Ratn",
                role: "Operational Executive",
                photo: "/media/PiyushRatn.jpg",
            },
            {
                name: "Vishal",
                role: "Executive Member",
                photo: "/media/Vishal.jpg",
            },
            {
                name: "Srujan Rai",
                role: "Executive Member",
                photo: "/media/SrujanRai.jpg",
            },
            {
                name: "Nandini Sharma",
                role: "Executive Member",
                photo: "/media/NNandini.png",
            },
            {
                name: "Kripa Chhajer",
                role: "Executive Member",
                photo: "/media/KripaChhajer.jpg",
            },
        ],
    },
    {
        id: "03",
        name: "Equity Alliance",
        subtext: "Guideline / Report / Resolve",
        intro: "This Equity Policy is instituted by the SMVIT Debating Society to ensure a respectful, inclusive, and safe environment. It operates as a foundational instrument of governance, predicated on the principle that debating, as an intellectual pursuit, must remain free from discrimination, harassment, or intimidation. Recognizing that inter-personal dynamics are shaped by pre-existing social structures, our core principles include Dignity and Equality, Accessibility, and Restorative Objectives. This policy applies uniformly to all members, adjudicators, and guests. Prohibited conduct includes bullying, vilification, sexual harassment, and the use of triggering language—focusing always on the impact of the conduct, regardless of intent.",
        icon: <Shield size={16} className="text-zinc-400" />,
        lead: {
            name: "Vittala Chaithanya",
            role: "Equity Head",
            photo: "/media/VittalaChaithanyaNM.jpg",
            isLead: true,
        },
        members: [
            {
                name: "Mohammed Owais",
                role: "Equity Head",
                photo: "/media/MohammedOwais.jpg",
            },
            {
                name: "Nainika",
                role: "Equity Executive",
                photo: "/media/NNainika.jpg",
            },
            {
                name: "Advitiya Pandey",
                role: "Equity Member",
                photo: "/media/AdvitiyaPandey.jpg",
            },
            {
                name: "Stuti Padhi",
                role: "Equity Member",
                photo: "/media/StutiPadhi.jpg",
            },
        ],
    },
    {
        id: "04",
        name: "Tech Team",
        subtext: "Code / Build / Deploy",
        intro: "Engineering the digital stage for modern debate. We build the interfaces that bridge the gap between tradition and technology.",
        icon: <Code size={16} className="text-zinc-400" />,
        lead: {
            name: "Md Mobasshir Shakil Khan",
            role: "Tech Lead",
            photo: "/media/Mobii.jpg",
            isLead: true,
        },
        members: [],
    },
    {
        id: "05",
        name: "Social Sphere",
        subtext: "Aesthetic / Reach / Impact",
        intro: "Curating the global signal of DEBSOC. Our media team crafts the visual identity and narrative that defines our presence in the digital age.",
        icon: <Share2 size={16} className="text-zinc-400" />,
        lead: {
            name: "Ananya Singh",
            role: "Social Media Lead",
            photo: "/media/AnanyaSingh.jpg",
            isLead: true,
        },
        members: [
            {
                name: "Pankhuri Singh",
                role: "Social Media Member",
                photo: "/media/PankhuriSingh.jpg",
            },
            {
                name: "Kanani Utsav",
                role: "Social Media Member",
                photo: "/media/KananiUtsav.jpg",
            },
        ],
    },
    {
        id: "06",
        name: "Content Engine",
        subtext: "Research / Write / Refine",
        intro: "Generating the raw fuel for argument. We distill complex global narratives into structured battlegrounds for intellectual combat.",
        icon: <FileText size={16} className="text-zinc-400" />,
        lead: {
            name: "Anika Gupta",
            role: "Content Head",
            photo: "/media/AnikaGupta.jpg",
            isLead: true,
        },
        members: [
            {
                name: "Rishikesh Chandra",
                role: "Content Head",
                photo: "/media/RishikeshChandra.jpg",
            },
            {
                name: "Tanmay Shankar",
                role: "Content Member",
                photo: "/media/TanmayShankar.jpg",
            },
            {
                name: "Pranathi N P",
                role: "Content Member",
                photo: "/media/PranathiNP.jpg",
            },
            {
                name: "Mohammed Rayyan",
                role: "Content Member",
                photo: "/media/MohammedRayyanKhaleel.jpg",
            },
        ],
    },
];

/* ─────────────────────────────────────────────
   Animated Section Wrapper
   ───────────────────────────────────────────── */

function AnimatedSection({
    children,
    className = "",
    delay = 0,
    ...props
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
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
            {threshold: 0.1},
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <div
            ref={ref}
            {...props}
            className={`transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12"
            } ${className}`}
        >
            {children}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Department Section Component
   ───────────────────────────────────────────── */

function MemberCard({
    member,
    size = "md",
    delay = 0,
    objectPosition = "center",
    scale = "scale-100",
    contain = false,
}: {
    member: Member;
    size?: "lg" | "md" | "sm";
    delay?: number;
    objectPosition?: string;
    scale?: string;
    contain?: boolean;
}) {
    const sizes = {
        lg: "text-lg md:text-2xl",
        md: "text-sm md:text-lg",
        sm: "text-[10px] md:text-sm",
    };

    return (
        <AnimatedSection delay={delay} className="group h-full min-h-0">
            <div className="relative w-full h-full overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-700">
                <div className="absolute inset-0 z-10">
                    <div className="relative w-full h-full md:grayscale md:group-hover:grayscale-0 transition-all duration-1000">
                        {contain && (
                            <Image
                                src={member.photo}
                                alt=""
                                fill
                                draggable={false}
                                className="object-cover blur-2xl opacity-30 scale-110 pointer-events-none select-none"
                            />
                        )}
                        <Image
                            src={member.photo}
                            alt={member.name}
                            fill
                            draggable={false}
                            className={`${contain ? "object-contain p-8 md:p-12" : "object-cover"} ${scale} transition-transform duration-700 pointer-events-none select-none`}
                            style={{objectPosition}}
                            sizes="30vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full z-20 p-2 md:p-4 bg-gradient-to-t from-black/92 via-black/45 to-transparent">
                    <h3
                        className={`font-black uppercase tracking-tight leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] ${sizes[size]}`}
                    >
                        {member.name}
                    </h3>
                    <span className="text-[7px] md:text-[9px] tracking-[0.2em] uppercase text-white/85 block mt-0.5 font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                        {member.role}
                    </span>
                </div>
            </div>
        </AnimatedSection>
    );
}

function SwipeHint({
    label = "Swipe to view more",
    className = "",
}: {
    label?: string;
    className?: string;
}) {
    return (
        <motion.div
            aria-hidden="true"
            className={`mt-3 flex items-center justify-center gap-3 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/45 pointer-events-none select-none ${className}`}
            initial={{opacity: 0, y: 4}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.4, ease: "easeOut"}}
        >
            <span>{label}</span>
            <div className="relative h-[2px] w-16 overflow-hidden rounded-full bg-white/15">
                <motion.div
                    className="absolute top-0 left-0 h-full w-6 rounded-full bg-white/70"
                    animate={{x: [0, 40, 0]}}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>
        </motion.div>
    );
}

function DepartmentSection({dept, id}: {dept: Department; id?: string}) {
    const isOpCore = dept.name === "Operational Core";
    const isEquity = dept.name === "Equity Alliance";
    const isSpecialGrid = isOpCore || isEquity;

    const allMembers = [dept.lead, ...dept.members];

    // Grouping logic for hierarchy
    const leads = allMembers.filter(
        (m) =>
            m.role.toLowerCase().includes("lead") ||
            m.role.toLowerCase().includes("head"),
    );

    // Executives (Middle tier)
    const executives = allMembers.filter(
        (m) =>
            m.role.toLowerCase().includes("executive") &&
            !m.role.toLowerCase().includes("member"),
    );

    // Members (Base tier)
    const regularMembers = allMembers.filter(
        (m) =>
            (m.role.toLowerCase().includes("member") ||
                (isEquity && m.name === "Stuti Padhi")) &&
            !m.role.toLowerCase().includes("lead") &&
            !m.role.toLowerCase().includes("head"),
    );

    const missionDirective = (
        <AnimatedSection
            delay={150}
            className={`relative group overflow-hidden transition-all flex flex-col justify-center border border-white/5 bg-white/[0.02] lg:hover:bg-white/[0.04]
        ${
            isEquity
                ? "flex-1 h-full p-4 md:p-6"
                : "flex-1 w-full max-w-3xl p-4 md:p-6"
        }`}
        >
            <div className="flex justify-between items-center mb-2 md:mb-3 shrink-0">
                <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 group-hover:text-white/60 transition-colors">
                    Mission Directive
                </h4>
                <ArrowUpRight
                    size={14}
                    className="text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1"
                />
            </div>
            <div className="overflow-y-auto custom-scrollbar pr-2 min-h-0">
                <p
                    className={`text-zinc-400 leading-relaxed font-light italic group-hover:text-white transition-colors ${isEquity ? "text-[9px] md:text-[10px] lg:text-[11px]" : "text-[11px] md:text-[13px]"}`}
                >
                    "{dept.intro}"
                </p>
            </div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-white/10 group-hover:border-white/40 transition-colors" />
            <motion.div className="absolute inset-0 bg-white/[0.01] -z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        </AnimatedSection>
    );

    return (
        <section
            id={id}
            className="relative w-full min-h-[78svh] md:h-screen py-5 sm:py-8 px-4 sm:px-6 md:px-12 overflow-hidden border-b border-white/[0.03] bg-[#050505] flex flex-col"
        >
            <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[10rem] md:text-[20rem] font-black text-white/[0.01] pointer-events-none select-none z-0">
                {dept.id}
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-stretch mb-3 sm:mb-4 md:mb-8 z-10 shrink-0 gap-3 sm:gap-4 lg:gap-16">
                <AnimatedSection className="shrink-0 flex flex-col justify-center">
                    <h2 className="text-[clamp(1.5rem,5vw,6rem)] font-black tracking-[-0.05em] uppercase text-white leading-none pb-2">
                        {dept.name}
                    </h2>
                </AnimatedSection>

                {!isEquity &&
                    dept.name !== "Tech Team" &&
                    dept.name !== "Social Sphere" && (
                        <div className="hidden md:flex flex-1">
                            {missionDirective}
                        </div>
                    )}
            </div>

            <div className="z-10 md:hidden pb-4 space-y-4">
                <AnimatedSection
                    delay={180}
                    className="border border-white/10 bg-white/[0.03] p-3"
                >
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.34em] text-zinc-500">
                            Mission Directive
                        </p>
                        {dept.icon}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-zinc-300 max-h-16 overflow-y-auto custom-scrollbar">
                        {dept.intro}
                    </p>
                </AnimatedSection>

                <div
                    className="overflow-x-auto overflow-y-hidden hide-scrollbar overscroll-x-contain overscroll-y-none [touch-action:pan-x]"
                >
                    <div className="flex gap-3 snap-x snap-mandatory pb-1 select-none">
                        {allMembers.map((member, index) => (
                            <div
                                key={`${dept.id}-${member.name}`}
                                className="snap-start shrink-0 w-[68vw] min-w-[250px] max-w-[340px] h-[clamp(280px,45svh,400px)]"
                            >
                                <MemberCard
                                    member={member}
                                    size={
                                        member.role
                                            .toLowerCase()
                                            .includes("lead") ||
                                        member.role
                                            .toLowerCase()
                                            .includes("head")
                                            ? "md"
                                            : "sm"
                                    }
                                    delay={220 + index * 60}
                                    objectPosition="center 15%"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                {allMembers.length > 1 && (
                    <SwipeHint label="Swipe to see all members" />
                )}
            </div>

            <div className="hidden md:block flex-1 min-h-[400px] z-10 pb-0 sm:pb-2">
                {dept.name === "Social Sphere" ? (
                    <div className="h-full flex gap-4 md:gap-6">
                        <div className="w-[22%] md:w-[20%] lg:w-[18%] h-full shrink-0">
                            {leads[0] && (
                                <MemberCard
                                    member={leads[0]}
                                    size="lg"
                                    delay={200}
                                    objectPosition="top"
                                />
                            )}
                        </div>
                        <div className="w-[22%] md:w-[20%] lg:w-[18%] h-full flex flex-col gap-3 md:gap-4 shrink-0">
                            <div className="flex-1 min-h-0">
                                {regularMembers[0] && (
                                    <MemberCard
                                        member={regularMembers[0]}
                                        size="md"
                                        delay={300}
                                        objectPosition="center"
                                    />
                                )}
                            </div>
                            <div className="flex-1 min-h-0">
                                {regularMembers[1] && (
                                    <MemberCard
                                        member={regularMembers[1]}
                                        size="md"
                                        delay={400}
                                        objectPosition="bottom"
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 h-full">{missionDirective}</div>
                    </div>
                ) : isSpecialGrid ? (
                    <div className="h-full flex gap-4 md:gap-6">
                        {/* LEADS COLUMN (Vertical Stack) */}
                        <div className="w-[28%] md:w-[25%] lg:w-[22%] flex flex-col gap-3 md:gap-4 shrink-0">
                            <div className="flex-1 min-h-0">
                                <MemberCard
                                    member={
                                        leads.find(
                                            (m) =>
                                                m.name.includes("Dhruv") ||
                                                m.name.includes("Vittala"),
                                        ) || leads[0]
                                    }
                                    size="lg"
                                    delay={200}
                                    objectPosition="center 10%"
                                />
                            </div>
                            <div className="flex-1 min-h-0">
                                <MemberCard
                                    member={
                                        leads.find(
                                            (m) =>
                                                m.name.includes("Rohan") ||
                                                m.name.includes("Owais"),
                                        ) || leads[1]
                                    }
                                    size="lg"
                                    delay={400}
                                    objectPosition={
                                        (
                                            leads.find(
                                                (m) =>
                                                    m.name.includes("Rohan") ||
                                                    m.name.includes("Owais"),
                                            ) || leads[1]
                                        ).name.includes("Rohan")
                                            ? "center"
                                            : "center 10%"
                                    }
                                />
                            </div>
                        </div>

                        {/* TEAM GRID (Flexible Remaining Space) */}
                        <div className="flex-1 flex flex-col gap-4 md:gap-6">
                            {/* EXECUTIVES SECTION (Bigger weight) */}
                            <div className="flex-1 min-h-0">
                                <div className="h-full flex gap-4 justify-center">
                                    {executives.map((m, i) => (
                                        <div
                                            key={m.name}
                                            className="h-full min-h-0 flex-1"
                                        >
                                            <MemberCard
                                                member={m}
                                                size="sm"
                                                delay={300 + i * 50}
                                                objectPosition={
                                                    m.name.includes("Srejoni")
                                                        ? "center 15%"
                                                        : "center 10%"
                                                }
                                                scale="scale-100"
                                            />
                                        </div>
                                    ))}
                                    {isEquity && missionDirective}
                                    {!isEquity && executives.length === 0 && (
                                        <div className="flex-1 h-full bg-white/[0.01] border border-dashed border-white/5 flex items-center justify-center text-white/5 uppercase text-[9px] tracking-widest">
                                            Executive Tier
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* MEMBERS SECTION (Smaller weight) */}
                            <div className="flex-1 min-h-0">
                                <div className="h-full flex gap-3 md:gap-4 overflow-x-auto hide-scrollbar">
                                    {regularMembers.map((m, i) => (
                                        <div
                                            key={m.name}
                                            className="min-w-[140px] md:min-w-0 md:flex-1 h-full min-h-0"
                                        >
                                            <MemberCard
                                                member={m}
                                                size="sm"
                                                delay={500 + i * 50}
                                                objectPosition="center 10%"
                                            />
                                        </div>
                                    ))}
                                    {regularMembers.length < 4 && (
                                        <div className="flex-1 hidden md:block" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : dept.name === "Tech Team" ? (
                    <div className="h-full flex gap-4 md:gap-6">
                        <div className="w-[70%] sm:w-[60%] md:w-[45%] lg:w-[35%] h-full shrink-0">
                            {leads[0] && (
                                <MemberCard
                                    member={leads[0]}
                                    size="lg"
                                    delay={200}
                                    objectPosition="center"
                                />
                            )}
                        </div>
                        <div className="flex-1 min-h-0 h-full">
                            {missionDirective}
                        </div>
                    </div>
                ) : dept.name === "Content Engine" ? (
                    <div className="h-full flex gap-4 md:gap-6">
                        {/* Left Column: Rishikesh (leads[1]) */}
                        <div className="w-[30%] md:w-[35%] lg:w-[28%] h-full shrink-0">
                            {leads[1] && (
                                <MemberCard
                                    member={leads[1]}
                                    size="lg"
                                    delay={200}
                                    objectPosition="center"
                                />
                            )}
                        </div>

                        {/* Right Column Group */}
                        <div className="flex-1 h-full flex flex-col gap-4 md:gap-6">
                            {/* Top Row: Anika (leads[0]) */}
                            <div className="flex-[1.3] min-h-0">
                                {leads[0] && (
                                    <MemberCard
                                        member={leads[0]}
                                        size="lg"
                                        delay={250}
                                        objectPosition="center 25%"
                                    />
                                )}
                            </div>

                            {/* Bottom Row: Tanmay, Rayyan, Pranati */}
                            <div className="flex-1 min-h-0 flex gap-4 md:gap-6">
                                {regularMembers[0] && (
                                    <div className="flex-1 h-full">
                                        <MemberCard
                                            member={regularMembers[0]}
                                            size="sm"
                                            delay={300}
                                            objectPosition="center 10%"
                                        />
                                    </div>
                                )}
                                {regularMembers[2] && (
                                    <div className="flex-1 h-full">
                                        <MemberCard
                                            member={regularMembers[2]}
                                            size="sm"
                                            delay={350}
                                            objectPosition="center 40%"
                                        />
                                    </div>
                                )}
                                {regularMembers[1] && (
                                    <div className="flex-1 h-full">
                                        <MemberCard
                                            member={regularMembers[1]}
                                            size="sm"
                                            delay={400}
                                            objectPosition="center 10%"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full gap-4">
                        {leads.length > 0 && (
                            <div className="flex-[1.8] flex gap-4">
                                {leads.map((m, i) => (
                                    <div
                                        key={m.name}
                                        className={`h-full ${leads.length === 1 ? "w-[28%] md:w-[24%] lg:w-[20%] shrink-0" : "flex-1"}`}
                                    >
                                        <MemberCard
                                            member={m}
                                            size="lg"
                                            delay={200 + i * 50}
                                            objectPosition="center"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        {executives.length > 0 && (
                            <div className="flex-[1.2] flex gap-4">
                                {executives.map((m, i) => (
                                    <div
                                        key={m.name}
                                        className={`h-full ${executives.length === 1 ? "w-[28%] md:w-[24%] lg:w-[20%] shrink-0" : "flex-1"}`}
                                    >
                                        <MemberCard
                                            member={m}
                                            size="md"
                                            delay={300 + i * 50}
                                            objectPosition="center 10%"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        {regularMembers.length > 0 && (
                            <div className="flex-1 flex gap-4">
                                {regularMembers.map((m, i) => (
                                    <div
                                        key={m.name}
                                        className={`h-full ${regularMembers.length < 4 ? "w-[140px] md:w-[25%] lg:w-[20%] shrink-0" : "flex-1"}`}
                                    >
                                        <MemberCard
                                            member={m}
                                            size="sm"
                                            delay={400 + i * 50}
                                            objectPosition="center 10%"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

        </section>
    );
}

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */

export default function TeamSection() {
    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({behavior: "smooth"});
        }
    };

    return (
        <div
            id="team"
            className="relative w-full overflow-hidden bg-[#030303] flex flex-col z-50 text-white hide-scrollbar min-h-[100svh]"
        >
            {/* ─────────────────────────────────────────────
          SECTION 01 — THE ARCHITECT (President)
          ───────────────────────────────────────────── */}
            <section
                id="identity"
                className="relative w-full min-h-[72svh] md:min-h-[100svh] flex flex-col md:justify-end overflow-hidden border-b border-white/[0.05]"
            >
                {/* Watermark Section Number */}
                <div className="absolute top-12 right-8 md:right-12 text-[8rem] md:text-[14rem] font-black text-white/[0.02] leading-none pointer-events-none select-none">
                    01
                </div>

                {/* Main Spread — responsive: desktop grid, mobile stacked */}
                <div className="w-full px-4 sm:px-8 md:px-12 pb-8 sm:pb-12 z-10 relative md:flex-1 flex flex-col min-h-0 pt-8 sm:pt-10 lg:pt-12">
                    {/* LEADERSHIP heading */}
                    <AnimatedSection
                        delay={100}
                        className="mb-4 sm:mb-6 md:mb-8 shrink-0"
                    >
                        <h1 className="text-[clamp(2.5rem,8vw,7rem)] font-black leading-none tracking-[-0.05em] uppercase text-white">
                            LEADERSHIP
                        </h1>
                    </AnimatedSection>

                    {/* Desktop grid (hidden on mobile) */}
                    <div className="flex-1 min-h-0 hidden md:grid md:grid-cols-[30%_1fr_35%] md:grid-rows-[auto_1fr_auto] gap-x-6 lg:gap-x-10 gap-y-0">
                        {/* Kanishk photo — spans all 3 rows on the left */}
                        <div className="row-span-3 col-start-1 min-h-[400px] lg:min-h-[500px]">
                            <AnimatedSection
                                className="group w-full h-full"
                                delay={300}
                            >
                                <div className="relative w-full h-full overflow-hidden grayscale contrast-125 brightness-90 group-hover:grayscale-0 transition-all duration-1000 border border-white/5 shadow-2xl">
                                    <Image
                                        src="/media/KanishkChaudhary.jpg"
                                        alt="President"
                                        fill
                                        draggable={false}
                                        className="object-cover scale-105 group-hover:scale-100 transition-transform duration-[2000ms] ease-out pointer-events-none select-none"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-80" />
                                    <div className="absolute bottom-8 left-6 md:bottom-10 md:left-8 text-left z-30">
                                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-[-0.03em] leading-none text-white">
                                            Kanishk
                                            <br />
                                            Chaudhary
                                        </h2>
                                    </div>
                                </div>
                            </AnimatedSection>
                        </div>

                        {/* PRESIDENT — overlay on Kanishk card */}
                        <div className="col-start-1 row-start-1 z-20 flex items-start pl-4 md:pl-6 pt-4 md:pt-6 pointer-events-none">
                            <AnimatedSection delay={200}>
                                <span className="text-[1.6rem] md:text-[2.5rem] lg:text-[3.5rem] font-black uppercase tracking-[-0.04em] text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                                    PRESIDENT
                                </span>
                                <div className="w-16 h-[2px] bg-white/30 mt-3" />
                            </AnimatedSection>
                        </div>

                        {/* Empty space — middle of column 2 */}
                        <div className="col-start-2 row-start-2" />

                        {/* Empty space — top of column 3 (Aditya is pushed down) */}
                        <div className="col-start-3 row-start-1" />

                        {/* Aditya photo — rows 2-3 on the right, pushed down */}
                        <div className="row-span-2 col-start-3 row-start-2 min-h-[350px] lg:min-h-[450px]">
                            <AnimatedSection
                                className="group w-full h-full"
                                delay={400}
                            >
                                <div className="relative w-full h-full overflow-hidden grayscale contrast-125 brightness-75 group-hover:grayscale-0 transition-all duration-1000 border border-white/5 shadow-2xl">
                                    <Image
                                        src="/media/AdityaKumarSingh.jpg"
                                        alt="Vice President"
                                        fill
                                        draggable={false}
                                        className="object-cover pointer-events-none select-none"
                                        sizes="600px"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-95" />
                                    <div className="absolute bottom-8 left-6 md:bottom-10 md:left-8 text-left z-30">
                                        <h3 className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                                            Aditya Kumar
                                            <br />
                                            Singh
                                        </h3>
                                    </div>
                                </div>
                            </AnimatedSection>
                        </div>

                        {/* VICE PRESIDENT — directly above Aditya card */}
                        <div className="col-start-3 row-start-1 z-20 flex items-end pl-4 md:pl-6 pb-4 md:pb-6 pointer-events-none">
                            <AnimatedSection delay={500}>
                                <span className="text-[1.3rem] md:text-[2rem] lg:text-[2.6rem] font-black uppercase tracking-[-0.04em] text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                                    VICE
                                    <br />
                                    PRESIDENT
                                </span>
                                <div className="w-16 h-[2px] bg-white/60 mt-3 shadow-[0_0_10px_rgba(0,0,0,0.75)]" />
                            </AnimatedSection>
                        </div>
                    </div>

                    {/* Mobile: stacked president + VP cards */}
                    <div
                        className="md:hidden overflow-x-auto overflow-y-hidden hide-scrollbar overscroll-x-contain overscroll-y-none [touch-action:pan-x] mt-2"
                    >
                        <div className="flex gap-3 h-full snap-x snap-mandatory pb-1 select-none">
                            <div className="snap-start shrink-0 w-[85vw] max-w-[460px] h-[clamp(300px,50svh,500px)]">
                                <AnimatedSection
                                    className="group w-full h-full"
                                    delay={300}
                                >
                                    <div className="relative w-full h-full overflow-hidden border border-white/5 shadow-2xl">
                                        <Image
                                            src="/media/KanishkChaudhary.jpg"
                                            alt="President"
                                            fill
                                            draggable={false}
                                            className="object-cover object-top pointer-events-none select-none"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-80" />
                                        <div className="absolute top-4 left-4 z-30">
                                            <span className="text-lg font-black uppercase tracking-tight text-white drop-shadow-lg">
                                                PRESIDENT
                                            </span>
                                            <div className="w-10 h-[2px] bg-white/30 mt-2" />
                                        </div>
                                        <div className="absolute bottom-5 left-5 z-30">
                                            <h2 className="text-xl font-black uppercase tracking-tight text-white">
                                                Kanishk Chaudhary
                                            </h2>
                                        </div>
                                    </div>
                                </AnimatedSection>
                            </div>

                            <div className="snap-start shrink-0 w-[85vw] max-w-[460px] h-[clamp(300px,50svh,500px)]">
                                <AnimatedSection
                                    className="group w-full h-full"
                                    delay={400}
                                >
                                    <div className="relative w-full h-full overflow-hidden border border-white/5 shadow-2xl">
                                        <Image
                                            src="/media/AdityaKumarSingh.jpg"
                                            alt="Vice President"
                                            fill
                                            draggable={false}
                                            className="object-cover pointer-events-none select-none"
                                            sizes="100vw"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-95" />
                                        <div className="absolute top-4 left-4 z-30">
                                            <span className="text-base font-black uppercase tracking-tight text-white drop-shadow-lg">
                                                VICE PRESIDENT
                                            </span>
                                            <div className="w-10 h-[2px] bg-white/60 mt-2" />
                                        </div>
                                        <div className="absolute bottom-5 left-5 z-30">
                                            <h3 className="text-lg font-black uppercase tracking-tight text-white">
                                                Aditya Kumar Singh
                                            </h3>
                                        </div>
                                    </div>
                                </AnimatedSection>
                            </div>
                        </div>
                    </div>
                    <SwipeHint
                        label="Swipe for leadership cards"
                        className="mt-2"
                    />
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
        </div>
    );
}
