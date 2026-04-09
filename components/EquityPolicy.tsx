"use client";

import React from "react";
import {motion} from "framer-motion";
import {
    Mail,
    Phone,
    ShieldAlert,
    Scale,
    Users,
    AlertCircle,
} from "lucide-react";
import {ElegantShape} from "./ui/shape-landing-hero";

const fadeUpVariants = {
    hidden: {opacity: 0, y: 30},
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 1,
            delay: 0.1 + i * 0.1,
            ease: [0.25, 0.4, 0.25, 1],
        },
    }),
};

export default function EquityPolicy() {
    const [navHeight, setNavHeight] = React.useState(100);

    React.useEffect(() => {
        const updateNavHeight = () => {
            const nav = document.querySelector("nav");
            if (nav) {
                setNavHeight(nav.offsetHeight);
            }
        };

        // Initial setup
        updateNavHeight();

        // Update on resize
        window.addEventListener("resize", updateNavHeight);
        return () => window.removeEventListener("resize", updateNavHeight);
    }, []);

    return (
        <div className="relative min-h-screen w-full bg-[#030303] text-white overflow-hidden selection:bg-indigo-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-rose-500/5 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <ElegantShape
                    delay={0.3}
                    width={600}
                    height={140}
                    rotate={12}
                    gradient="from-indigo-500/[0.15]"
                    className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
                />
                <ElegantShape
                    delay={0.5}
                    width={500}
                    height={120}
                    rotate={-15}
                    gradient="from-rose-500/[0.15]"
                    className="right-[-5%] top-[70%] md:top-[75%]"
                />
                <ElegantShape
                    delay={0.4}
                    width={300}
                    height={80}
                    rotate={-8}
                    gradient="from-violet-500/[0.15]"
                    className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                />
                <ElegantShape
                    delay={0.6}
                    width={200}
                    height={60}
                    rotate={20}
                    gradient="from-amber-500/[0.15]"
                    className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                />
            </div>

            {/* Main Content */}
            <div
                className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 pb-12 sm:pb-20 md:pb-32"
                style={{paddingTop: `${navHeight + 24}px`}}
            >
                {/* Header */}
                <motion.div
                    custom={0}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUpVariants}
                    className="text-center mb-10 sm:mb-16 md:mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/3 border border-white/8 mb-4 sm:mb-8">
                        <Scale className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs sm:text-sm text-white/70 tracking-wide uppercase">
                            Official Guidelines
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-8">
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-300 via-white/90 to-rose-300">
                            Equity Policy Document
                        </span>
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                        Ensuring a respectful, inclusive, and safe environment
                        for all members of the SMVIT Debating Society.
                    </p>
                </motion.div>

                {/* Contact Section */}
                <motion.div
                    custom={1}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUpVariants}
                    className="mb-10 sm:mb-16 md:mb-20"
                >
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-10">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white/90">
                            Equity Committee
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {[
                            {
                                name: "Vittala Chaithanya",
                                role: "Equity Head",
                                email: "vittalachaithanya@gmail.com",
                                phone: "7975246745",
                            },
                            {
                                name: "Mohammad Owais",
                                role: "Equity Head",
                                email: "owaismohammed795@gmail.com",
                                phone: "9008828640",
                            },
                            {
                                name: "Nainika",
                                role: "Member, Equity Committee",
                                email: "nainika13579@gmail.com",
                                phone: "9934109237",
                            },
                        ].map((contact, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{y: -5}}
                                className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-white/3 border border-white/8 backdrop-blur-md hover:bg-white/5 transition-colors"
                            >
                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white/90 mb-1">
                                    {contact.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-indigo-400 font-medium mb-3 sm:mb-6">
                                    {contact.role}
                                </p>
                                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-white/60">
                                    <div className="flex items-center gap-3 hover:text-white/90 transition-colors">
                                        <Mail className="w-4 h-4 text-white/40 shrink-0" />
                                        <a
                                            href={`mailto:${contact.email}`}
                                            className="truncate"
                                        >
                                            {contact.email}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-3 hover:text-white/90 transition-colors">
                                        <Phone className="w-4 h-4 text-white/40 shrink-0" />
                                        <a href={`tel:${contact.phone}`}>
                                            {contact.phone}
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Action Button */}
                <motion.div
                    custom={2}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUpVariants}
                    className="flex justify-center mb-12 sm:mb-16 md:mb-24"
                >
                    <a
                        href="#"
                        className="group relative inline-flex items-center gap-2 sm:gap-3 px-5 py-3 sm:px-8 sm:py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm sm:text-base text-white font-medium transition-all duration-300 backdrop-blur-md overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-indigo-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <ShieldAlert className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                        <span className="relative">
                            Anonymous Complaint Form
                        </span>
                    </a>
                </motion.div>

                {/* Content Body */}
                <motion.div
                    custom={3}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUpVariants}
                    className="max-w-4xl mx-auto space-y-6 sm:space-y-8 md:space-y-12"
                >
                    {/* Section 1 */}
                    <div className="p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl bg-white/2 border border-white/[0.05] backdrop-blur-sm">
                        <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8 pb-4 sm:pb-6 border-b border-white/8">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                                <span className="text-lg sm:text-xl font-bold text-indigo-300">
                                    1
                                </span>
                            </div>
                            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white/90">
                                Preamble
                            </h2>
                        </div>

                        <div className="space-y-6 sm:space-y-10 text-white/70 leading-relaxed text-base sm:text-lg">
                            <div>
                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white/90 mb-3 sm:mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    1.1 Purpose
                                </h3>
                                <p className="mb-4">
                                    This Equity Policy is instituted by the
                                    SMVIT Debating Society to ensure a
                                    respectful, inclusive, and safe environment
                                    for all individuals participating in any
                                    activities organized, facilitated, or
                                    affiliated with the Society.
                                </p>
                                <p>
                                    This Policy operates as a foundational
                                    instrument of governance for the internal
                                    conduct of the Society&apos;s members and
                                    participants, and applies uniformly without
                                    exception. The Policy is predicated on the
                                    principle that debating, as an intellectual
                                    pursuit, must remain free from
                                    discrimination, harassment, intimidation, or
                                    any conduct that undermines the dignity or
                                    equitable participation of any individual.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white/90 mb-3 sm:mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    1.2 Background and Principles
                                </h3>
                                <p className="mb-4 sm:mb-6">
                                    The Society recognizes that inter-personal
                                    dynamics within competitive and academic
                                    spaces are often shaped by pre-existing
                                    social structures and inequities. This
                                    Policy is rooted in the following
                                    principles:
                                </p>
                                <div className="grid gap-4">
                                    {[
                                        {
                                            title: "Dignity and Equality",
                                            desc: "Every participant is entitled to an environment of mutual respect.",
                                        },
                                        {
                                            title: "Accessibility and Inclusion",
                                            desc: "The Society will undertake all reasonable efforts to ensure its activities are accessible to all.",
                                        },
                                        {
                                            title: "Impact Over Intent",
                                            desc: "In adjudicating violations, the focus shall be on the impact of the conduct, regardless of intent.",
                                        },
                                        {
                                            title: "Restorative & Educational",
                                            desc: "The Society is committed to rehabilitation, mediation, and using equity as an educational tool.",
                                        },
                                        {
                                            title: "Prevention and Proactivity",
                                            desc: "Equity is a proactive standard, and the Society will cultivate a culture where violations are less likely to arise.",
                                        },
                                    ].map((principle, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/2 border border-white/[0.05]"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2.5 shrink-0" />
                                            <div>
                                                <strong className="text-white/90 block mb-1">
                                                    {principle.title}
                                                </strong>
                                                <span className="text-white/60 text-sm sm:text-base">
                                                    {principle.desc}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div className="p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl bg-white/2 border border-white/[0.05] backdrop-blur-sm">
                        <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8 pb-4 sm:pb-6 border-b border-white/8">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                                <span className="text-lg sm:text-xl font-bold text-rose-300">
                                    2
                                </span>
                            </div>
                            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white/90">
                                Scope of Application
                            </h2>
                        </div>

                        <div className="text-white/70 leading-relaxed text-base sm:text-lg">
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-white/90 mb-3 sm:mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                2.1 Applicability
                            </h3>
                            <p className="p-3 sm:p-5 rounded-lg sm:rounded-xl bg-white/2 border border-white/[0.05]">
                                This Policy applies to all persons involved with
                                the SMVIT Debating Society, including members,
                                adjudicators, trainers, guest speakers,
                                committee members, volunteers, and external
                                participants.
                            </p>
                        </div>
                    </div>

                    {/* Section 3 */}
                    <div className="p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl bg-white/2 border border-white/[0.05] backdrop-blur-sm">
                        <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8 pb-4 sm:pb-6 border-b border-white/8">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                                <span className="text-lg sm:text-xl font-bold text-amber-300">
                                    3
                                </span>
                            </div>
                            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white/90">
                                Prohibited Conduct
                            </h2>
                        </div>

                        <div className="text-white/70 leading-relaxed text-base sm:text-lg">
                            <p className="mb-4 sm:mb-8">
                                All individuals subject to this Policy shall
                                refrain from engaging in any form of conduct
                                that constitutes a breach of equity principles.
                                Prohibited behaviors include, but are not
                                limited to:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {[
                                    "Harassment",
                                    "Bullying",
                                    "Discrimination",
                                    "Intimidation",
                                    "Sexual Harassment",
                                    "Vilification",
                                    "Victimisation",
                                    "Use of Inflammatory Language",
                                    "Technology Misuse (e.g. unconsented recording)",
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/2 border border-white/[0.05] hover:bg-white/4 transition-colors"
                                    >
                                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 shrink-0" />
                                        <span className="text-sm sm:text-base text-white/80">
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
