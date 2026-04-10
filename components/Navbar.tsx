"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Menu } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full flex justify-between items-center p-6 md:px-12 z-[100] bg-black/50 backdrop-blur-md border-b border-white/5">
      <Link href="/" className="flex items-center gap-1 font-light tracking-widest text-xl uppercase text-white">
        <Sparkles size={18} strokeWidth={1} className="text-white" />
        DEBSOC
      </Link>
      <div className="flex items-center gap-4 md:gap-8">
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-xs text-zinc-400 hover:text-white uppercase tracking-widest transition-colors font-light">
            Home
          </Link>
          <Link href="/session" className="text-xs text-white uppercase tracking-widest font-light">
            Session
          </Link>
        </div>
        <button className="text-white opacity-80 hover:opacity-100 transition-opacity">
          <Menu size={24} strokeWidth={1} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
