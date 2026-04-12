"use client";

import Link from "next/link";
import {useState, useRef, MouseEvent} from "react";

const socialIcons = [
    {
        name: "Youtube",
        href: "#",
        icon: (props: any) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                {...props}
            >
                <path d="M2.5 7.1C2.5 7.1 2.3 5.4 3 4.6 3.8 3.8 4.9 3.8 5.4 3.7 8.3 3.5 12 3.5 12 3.5s3.7 0 6.6.2c.5.1 1.6.1 2.4.9.7.8.5 2.5.5 2.5s.2 2 .2 4.1v1.5c0 2.1-.2 4.1-.2 4.1s-.2 1.7-.9 2.5c-.8.8-1.9.8-2.4.9-2.9.2-6.6.2-6.6.2s-3.7 0-6.6-.2c-.5-.1-1.6-.1-2.4-.9-.7-.8-.5-2.5-.5-2.5s-.2-2-.2-4.1v-1.5c0-2.1.2-4.1.2-4.1z" />
                <polygon points="9.5 15.5 16 11.5 9.5 7.5 9.5 15.5" />
            </svg>
        ),
    },
    {
        name: "Twitter",
        href: "#",
        icon: (props: any) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                {...props}
            >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
            </svg>
        ),
    },
    {
        name: "Instagram",
        href: "#",
        icon: (props: any) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                {...props}
            >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
        ),
    },
    {
        name: "Linkedin",
        href: "#",
        icon: (props: any) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                {...props}
            >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
            </svg>
        ),
    },
];

export default function Footer() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({x: 0, y: 0});
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <footer className="relative bg-black text-white pt-16 pb-8 overflow-hidden w-full h-auto">
            <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-14 relative z-10 flex flex-col md:flex-row justify-between items-start gap-10">
                {/* Left: Logo */}
                <div className="flex flex-col">
                    <span className="text-2xl font-extrabold tracking-tight mt-1 text-white">
                        SMVIT{" "}
                        <span className="text-zinc-400 font-medium">
                            DEBSOC
                        </span>
                    </span>
                </div>

                {/* Center: Links */}
                <div className="flex flex-col gap-3 text-sm text-zinc-400">
                    <Link
                        href="#"
                        className="hover:text-white transition-colors"
                    >
                        Dummy Link
                    </Link>
                    <Link
                        href="#"
                        className="hover:text-white transition-colors"
                    >
                        Dummy Link
                    </Link>
                    <Link
                        href="#"
                        className="hover:text-white transition-colors"
                    >
                        Dummy Link
                    </Link>
                </div>

                {/* Right: Social & Copyright */}
                <div className="flex flex-col gap-4 items-start md:items-end">
                    <div className="flex gap-3">
                        {socialIcons.map((social, idx) => (
                            <a
                                key={idx}
                                href={social.href}
                                aria-label={`Link to ${social.name}`}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300"
                            >
                                <social.icon className="w-5 h-5" />
                            </a>
                        ))}
                    </div>
                    <p className="text-xs text-zinc-600 mt-2">
                        &copy; 2026 SMVIT Debsoc. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Bottom Giant Faded Text */}
            <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="w-full mt-12 md:mt-20 flex justify-center relative overflow-hidden group select-none py-4"
            >
                {/* Base text */}
                <h1
                    className="text-[12vw] sm:text-[13vw] md:text-[14vw] font-black leading-none tracking-tight select-none pointer-events-none whitespace-nowrap text-center transition-opacity duration-300"
                    style={{
                        backgroundImage:
                            "linear-gradient(to bottom, #27272a, #000000)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                    }}
                >
                    SMVIT DEBSOC
                </h1>

                {/* Hover overlay text */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300 flex justify-center items-center"
                    style={{
                        opacity: isHovering ? 1 : 0,
                        WebkitMaskImage: `radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 100%)`,
                        maskImage: `radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 100%)`,
                    }}
                >
                    <h1 className="text-[12vw] sm:text-[13vw] md:text-[14vw] font-black leading-none tracking-tight select-none whitespace-nowrap text-center text-white">
                        SMVIT DEBSOC
                    </h1>
                </div>
            </div>
        </footer>
    );
}
