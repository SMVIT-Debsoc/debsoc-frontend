"use client";

import React from "react";
import Link from "next/link";
import {Sparkles, Menu} from "lucide-react";

const navLinks = [
    {name: "Home", href: "/"},
    {name: "Why Choose Us", href: "/?section=whychoose"},
    {name: "Team", href: "/?section=team"},
    {name: "Achievements", href: "/?section=achievements"},
    {name: "Alumni", href: "/?section=alumni"},
    {name: "Debate Timer", href: "/debate-timer"},
    {name: "Session", href: "/session"},
    {name: "Equity", href: "/equity"},
    {name: "Gallery", href: "/?section=gallery"},
];

const Navbar = () => {
    return (
        <nav className="fixed top-0 w-full flex justify-between items-center p-6 md:px-12 z-100 bg-black/50 backdrop-blur-md border-b border-white/5">
            <Link
                href="/"
                className="flex items-center gap-1 font-light tracking-widest text-xl uppercase text-white"
            >
                <Sparkles size={18} strokeWidth={1} className="text-white" />
                DEBSOC
            </Link>
            <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className="text-[10px] md:text-xs text-zinc-400 hover:text-white uppercase tracking-widest transition-colors font-light"
                    >
                        {link.name}
                    </Link>
                ))}
            </div>
            <div className="flex md:hidden items-center gap-8">
                <button className="text-white opacity-80 hover:opacity-100 transition-opacity">
                    <Menu size={24} strokeWidth={1} />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
