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
    return (
        <div className="relative min-h-screen w-full bg-[#030303] text-white overflow-hidden selection:bg-indigo-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl pointer-events-none" />
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
            <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 md:py-32">
                {/* Header */}
                <motion.div
                    custom={0}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUpVariants}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8">
                        <Scale className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-white/70 tracking-wide uppercase">
                            Official Guidelines
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">
                            Equity Policy Document
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
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
                    className="mb-20"
                >
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <Users className="w-6 h-6 text-rose-400" />
                        <h2 className="text-3xl font-bold text-white/90">
                            Equity Committee
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md hover:bg-white/[0.05] transition-colors"
                            >
                                <h3 className="text-xl font-bold text-white/90 mb-1">
                                    {contact.name}
                                </h3>
                                <p className="text-sm text-indigo-400 font-medium mb-6">
                                    {contact.role}
                                </p>
                                <div className="space-y-3 text-sm text-white/60">
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
                    className="flex justify-center mb-24"
                >
                    <a
                        href="#"
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-full text-white font-medium transition-all duration-300 backdrop-blur-md overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                    className="max-w-4xl mx-auto space-y-12"
                >
                    {/* Section 1 */}
                    <div className="p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/[0.08]">
                            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <span className="text-xl font-bold text-indigo-300">
                                    1
                                </span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white/90">
                                Preamble
                            </h2>
                        </div>

                        <div className="space-y-10 text-white/70 leading-relaxed text-lg">
                            <div>
                                <h3 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
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
                                <h3 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    1.2 Background and Principles
                                </h3>
                                <p className="mb-6">
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
                                            className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2.5 shrink-0" />
                                            <div>
                                                <strong className="text-white/90 block mb-1">
                                                    {principle.title}
                                                </strong>
                                                <span className="text-white/60 text-base">
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
                    <div className="p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/[0.08]">
                            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                <span className="text-xl font-bold text-rose-300">
                                    2
                                </span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white/90">
                                Scope of Application
                            </h2>
                        </div>

                        <div className="text-white/70 leading-relaxed text-lg">
                            <h3 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                2.1 Applicability
                            </h3>
                            <p className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                This Policy applies to all persons involved with
                                the SMVIT Debating Society, including members,
                                adjudicators, trainers, guest speakers,
                                committee members, volunteers, and external
                                participants.
                            </p>
                        </div>
                    </div>

                    {/* Section 3 */}
                    <div className="p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/[0.08]">
                            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <span className="text-xl font-bold text-amber-300">
                                    3
                                </span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white/90">
                                Prohibited Conduct
                            </h2>
                        </div>

                        <div className="text-white/70 leading-relaxed text-lg">
                            <p className="mb-8">
                                All individuals subject to this Policy shall
                                refrain from engaging in any form of conduct
                                that constitutes a breach of equity principles.
                                Prohibited behaviors include, but are not
                                limited to:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                        className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                                    >
                                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                                        <span className="text-white/80">
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
