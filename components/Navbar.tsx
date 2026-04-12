"use client";

import React, {useEffect, useState} from "react";
import Link from "next/link";
import {usePathname, useSearchParams} from "next/navigation";
import {Sparkles, Menu, X} from "lucide-react";

const navLinks = [
    {name: "Home", href: "/"},
    {name: "Why Choose Us", href: "/#whychoose"},
    {name: "Team", href: "/#team"},
    {name: "Achievements", href: "/#achievements"},
    {name: "Alumni", href: "/#alumni"},
    {name: "Debate Timer", href: "/debate-timer"},
    {name: "Session", href: "/session"},
    {name: "Equity", href: "/equity"},
    {name: "Gallery", href: "/gallery"},
];

const Navbar = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isVisible, setIsVisible] = useState(pathname !== "/");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const sectionParam = searchParams.get("section");
    const shouldShowByUrl =
        pathname !== "/" ||
        (!!sectionParam &&
            sectionParam !== "home" &&
            sectionParam !== "explore");

    useEffect(() => {
        if (pathname !== "/") {
            setIsVisible(true);
            return;
        }

        const resolveVisibility = (currentSection?: string) => {
            const isMobile = window.innerWidth < 768;

            // Keep a sticky top navbar on mobile, including home hero.
            if (isMobile) {
                setIsVisible(true);
                return;
            }

            if (currentSection) {
                const shouldShow =
                    currentSection !== "home" && currentSection !== "explore";
                setIsVisible(shouldShow);
                return;
            }

            const lastKnownSection = (
                window as Window & {__debsocSection?: string}
            ).__debsocSection;
            const shouldShowByMemory =
                !!lastKnownSection &&
                lastKnownSection !== "home" &&
                lastKnownSection !== "explore";

            setIsVisible(shouldShowByUrl || shouldShowByMemory);
        };

        resolveVisibility();

        const handleSectionChange = (event: Event) => {
            const customEvent = event as CustomEvent<{section?: string}>;
            resolveVisibility(customEvent.detail?.section);
        };

        const handleResize = () => resolveVisibility();

        window.addEventListener("debsoc:section-change", handleSectionChange);
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener(
                "debsoc:section-change",
                handleSectionChange,
            );
            window.removeEventListener("resize", handleResize);
        };
    }, [pathname, shouldShowByUrl]);

    useEffect(() => {
        // Close mobile menu when route changes.
        setIsMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isVisible) {
            setIsMenuOpen(false);
        }
    }, [isVisible]);

    useEffect(() => {
        if (!isMenuOpen) return;

        // Prevent background scroll while full-screen mobile menu is open.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMenuOpen]);

    return (
        <header
            className={`fixed top-0 w-full px-4 sm:px-6 py-3 md:px-12 md:py-4 [padding-top:max(0.75rem,env(safe-area-inset-top))] z-999 border-b border-white/5 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isVisible
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-4 pointer-events-none"
            } ${
                isMenuOpen
                    ? "h-screen bg-black/90 backdrop-blur-2xl"
                    : "bg-black/55 backdrop-blur-md"
            }`}
        >
            <nav className="w-full flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-1 font-light tracking-widest text-xl uppercase text-white"
                >
                    <Sparkles
                        size={18}
                        strokeWidth={1}
                        className="text-white"
                    />
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

                <button
                    type="button"
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className="md:hidden text-white opacity-80 hover:opacity-100 transition-opacity"
                >
                    {isMenuOpen ? (
                        <X size={24} strokeWidth={1.5} />
                    ) : (
                        <Menu size={24} strokeWidth={1.5} />
                    )}
                </button>
            </nav>

            <div
                className={`md:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isMenuOpen
                        ? "max-h-[calc(100dvh-64px)] opacity-100 mt-6 pointer-events-auto"
                        : "max-h-0 opacity-0 mt-0 pointer-events-none"
                }`}
            >
                <div className="h-full overflow-y-auto pb-8">
                    <div className="border border-white/15 bg-black/65 backdrop-blur-2xl">
                        {navLinks.map((link) => (
                            <Link
                                key={`mobile-${link.name}`}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="block py-4 px-3 border-b border-white/10 last:border-b-0 text-sm text-zinc-100 hover:text-white uppercase tracking-widest transition-colors font-light"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
