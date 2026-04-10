"use client";

import React, {useEffect, useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
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
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(pathname !== "/");

    useEffect(() => {
        if (pathname !== "/") {
            setIsVisible(true);
            return;
        }

        // On home route, keep navbar hidden for hero/explore and reveal after section advances.
        const handleSectionChange = (event: Event) => {
            const customEvent = event as CustomEvent<{section?: string}>;
            const currentSection = customEvent.detail?.section;
            const shouldShow =
                currentSection !== "home" && currentSection !== "explore";
            setIsVisible(shouldShow);
        };

        // Default hidden on home until Home component emits the current section.
        setIsVisible(false);
        window.addEventListener("debsoc:section-change", handleSectionChange);

        return () => {
            window.removeEventListener(
                "debsoc:section-change",
                handleSectionChange,
            );
        };
    }, [pathname]);

    return (
        <nav
            className={`fixed top-0 w-full flex justify-between items-center p-6 md:px-12 z-100 border-b border-white/5 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isVisible
                    ? "opacity-100 translate-y-0 bg-black/55 backdrop-blur-md pointer-events-auto"
                    : "opacity-0 -translate-y-4 bg-black/0 backdrop-blur-none pointer-events-none"
            }`}
        >
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
