"use client";

import {useEffect, useRef, useState} from "react";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {useGSAP} from "@gsap/react";
import {Menu, Sparkles, X} from "lucide-react";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomeClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      /* 
        ==============================
        1. ON PAGE LOAD: DROP-IN WOBBLE
        ==============================
      */

      // We set perspective on the parent so the 3D rotation looks realistic
      gsap.set(".mic-wrapper", {perspective: 1000});
      gsap.set(".mic-element", {transformOrigin: "center center"});

      const dropTimeline = gsap.timeline();

      dropTimeline
        .fromTo(
          ".mic-element",
          {
            y: "-120vh",
            rotationZ: 15,
            rotationY: 45,
          },
          {
            y: 0,
            rotationZ: -5,
            rotationY: 0,
            duration: 1.2,
            ease: "power3.out",
          },
        )
        .to(
          ".mic-element",
          {
            rotationZ: 0,
            duration: 2,
            ease: "elastic.out(1, 0.3)", // Wobble settle effect
          },
          "-=0.2",
        );

      // Animate the rest of the elements normally
      gsap.from(".hero-text", {
        y: 50,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.4,
      });

      gsap.from(".mission-box", {
        x: 50,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.7,
      });

      gsap.from(".event-card", {
        x: 50,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.2,
        delay: 0.9,
      });

      /* 
        ==============================
        2. ON SCROLL: ROTARY SLIDE-TO-ICON
        ==============================
      */

      // Calculate target positions dynamically or use fixed vh/vw values
      // We want to move it to the top-right navbar corner

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1, // Smooth scrub
        },
      });

      // Move to bottom-right corner with a volumetric tilt instead of a flat paper spin
      scrollTl.to(
        ".mic-element",
        {
          x: "45vw", // Move right
          y: "40vh", // Move down to bottom right
          scale: 0.12, // Shrink completely
          rotationX: 20, // Tilt backward slightly
          rotationY: -25, // Turn slightly right
          rotationZ: -10, // Bank into the turn
          filter: "drop-shadow(-20px 20px 20px rgba(0,0,0,0.8))", // Shift shadow to enhance depth
          ease: "power2.inOut",
        },
        0,
      );

      // Fade out the hero text to signify we scrolled
      scrollTl.to(
        ".hero-text-container",
        {
          y: -100,
          opacity: 0,
          ease: "power1.inOut",
        },
        0,
      );
    },
    {scope: containerRef},
  );

  return (
    // Main container (vertical scroll removed)
    <div
      className="bg-[#000000] text-zinc-100 font-sans h-screen overflow-hidden selection:bg-white/20 selection:text-white"
      ref={containerRef}
    >
      {/* Sticky wrapper to keep layout locked while scrolling */}
      <div
        ref={stickyRef}
        className="sticky top-0 w-full h-screen overflow-hidden"
      >
        {/* Top Navbar */}
        <nav className="absolute top-0 w-full flex justify-between items-center p-8 md:px-12 z-50">
          <div className="flex items-center gap-1 font-light tracking-widest text-xl uppercase relative z-50">
            <Sparkles size={18} strokeWidth={1} className="text-white" />
            DEBSOC
          </div>

          <div className="flex items-center gap-6 z-50 relative">
            <button 
              className="text-white opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => setIsExploreOpen(true)}
            >
              <Menu size={28} strokeWidth={1} />
            </button>
          </div>
        </nav>

        {/* Main Background Mic Image */}
        <div className="mic-wrapper absolute inset-0 z-10 flex items-center justify-center md:justify-start md:left-[10%] pointer-events-none">
          <img
            src="/mic-nobg.png"
            alt="Silver Retro Microphone"
            className="mic-element h-[80vh] md:h-[90vh] w-auto object-contain object-bottom drop-shadow-[0_0_80px_rgba(255,255,255,0.15)] opacity-100"
            style={{transformStyle: "preserve-3d"}}
          />
        </div>

        {/* Right Side Content Container */}
        <div className="absolute top-0 right-0 w-full md:w-[50%] h-full flex flex-col justify-center items-end p-8 md:pr-12 md:pl-0 z-0">
          {/* Mission Box & Events Row */}
          <div className="flex flex-col md:flex-row items-start justify-end gap-12 w-full mt-24">
            {/* Mission Box */}
            <div className="mission-box bg-white/[0.02] backdrop-blur-xl border border-white/5 p-8 rounded block w-[300px] h-fit md:mt-24 shadow-2xl relative z-20">
              <h3 className="text-zinc-300 text-xs tracking-[0.2em] mb-4 uppercase">
                Mission
              </h3>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">
                We curate intellectual battlegrounds. To amplify voices,
                challenge perspectives, and elevate the debate.
                <br />
                <br />
                We are DEBSOC.
              </p>
            </div>

            {/* Explore / Navbar Contents Section */}
            <div className="flex flex-col w-full md:w-[450px] relative z-20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-zinc-200 text-lg tracking-[0.1em] uppercase font-light">
                  Explore
                </h3>
                <button 
                  onClick={() => setIsExploreOpen(true)}
                  className="text-xs text-white/50 hover:text-white uppercase tracking-widest border border-white/10 hover:bg-white/10 px-3 py-1 rounded transition-all"
                >
                  View All
                </button>
              </div>

              {/* Cards Scroll Container */}
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar w-full relative">
                {[
                  { title: "Team", sub1: "Current Roster", sub2: "Board Members" },
                  { title: "Achievements", sub1: "Trophies", sub2: "Milestones" },
                  { title: "Alumni", sub1: "Hall of Fame", sub2: "Past Debaters" },
                  { title: "Debate Timer", sub1: "Launch App", sub2: "Settings" },
                  { title: "Session", sub1: "Next Meet", sub2: "Resources" },
                  { title: "Equity", sub1: "Guidelines", sub2: "Report" },
                  { title: "Gallery", sub1: "Photos", sub2: "Videos" }
                ].flatMap((navItem, i) => [
                  // Rendering 2 cards for each navbar item as requested
                  <div key={`${navItem.title}-1`} className="event-card relative min-w-[280px] h-[160px] group flex-shrink-0 cursor-pointer overflow-hidden rounded-sm border border-white/10 bg-zinc-900">
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
                    <img
                      src={`/event${(i % 2) + 1}.png`}
                      alt={navItem.title}
                      className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700"
                    />
                    <div className="absolute bottom-4 left-4 z-20 pr-4">
                      <h4 className="text-sm text-white font-light uppercase tracking-wider leading-snug">
                        {navItem.title}:<br />{navItem.sub1}
                      </h4>
                    </div>
                    <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/80 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 text-black text-xs font-medium translate-y-4 group-hover:translate-y-0 transition-all">
                        <X size={14} /> View
                      </div>
                    </div>
                  </div>,
                  <div key={`${navItem.title}-2`} className="event-card relative min-w-[280px] h-[160px] group flex-shrink-0 cursor-pointer overflow-hidden rounded-sm border border-white/10 bg-zinc-900">
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
                    <img
                      src={`/event${((i + 1) % 2) + 1}.png`}
                      alt={navItem.title}
                      className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700"
                    />
                    <div className="absolute bottom-4 left-4 z-20 pr-4">
                      <h4 className="text-sm text-white font-light uppercase tracking-wider leading-snug">
                        {navItem.title}:<br />{navItem.sub2}
                      </h4>
                    </div>
                    <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/80 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 text-black text-xs font-medium translate-y-4 group-hover:translate-y-0 transition-all">
                        <X size={14} /> View
                      </div>
                    </div>
                  </div>
                ])}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left Titling */}
        <div className="hero-text-container absolute bottom-12 md:bottom-20 left-8 md:left-12 z-20 flex flex-col pointer-events-none">
          <h1 className="hero-text text-[3rem] md:text-[5.5rem] lg:text-[7rem] font-light leading-[1.1] tracking-tight text-white mb-2 max-w-4xl drop-shadow-lg">
            DEBSOC:
            <br />
            <span className="text-zinc-300">THE ART OF ARGUMENT.</span>
          </h1>
          <p className="hero-text text-sm md:text-lg text-zinc-400 font-light max-w-md mt-2 tracking-wide leading-relaxed drop-shadow">
            A high-end production studio for <br />
            discourse and debate.
          </p>
        </div>

        {/* Footer Links */}
        <div className="absolute bottom-8 right-8 md:right-12 z-20 flex gap-6 text-xs text-zinc-400 font-light tracking-wider hero-text-container">
          <a
            href="#"
            className="hover:text-white transition-colors underline underline-offset-4 decoration-zinc-600 hover:decoration-white"
          >
            Our Team
          </a>
          <a
            href="#"
            className="hover:text-white transition-colors underline underline-offset-4 decoration-zinc-600 hover:decoration-white"
          >
            Upcoming Events
          </a>
          <a
            href="#"
            className="hover:text-white transition-colors underline underline-offset-4 decoration-zinc-600 hover:decoration-white"
          >
            Contact
          </a>
        </div>
      </div>

      {/* Fullscreen Explore Overlay */}
      <div 
        className={`fixed inset-0 z-[100] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-start ${
          isExploreOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop Blob / Blur */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-3xl transition-opacity duration-700 ${
            isExploreOpen ? "opacity-100" : "opacity-0"
          }`} 
          onClick={() => setIsExploreOpen(false)}
        ></div>
        
        <button 
          className="absolute top-8 right-8 md:right-12 text-white z-[110] p-2 opacity-80 hover:opacity-100 transition-all hover:rotate-90"
          onClick={() => setIsExploreOpen(false)}
        >
          <X size={36} strokeWidth={1} />
        </button>

        {/* Fullscreen Slider Container */}
        <div 
          className={`relative z-[105] flex gap-12 px-[10vw] overflow-x-auto w-full h-[60vh] md:h-[70vh] items-center hide-scrollbar transition-transform duration-[1000ms] ease-out ${
            isExploreOpen ? "translate-x-0 opacity-100" : "translate-x-32 opacity-0"
          }`}
        >
          {[
            { title: "Team", sub1: "Current Roster", sub2: "Board Members" },
            { title: "Achievements", sub1: "Trophies", sub2: "Milestones" },
            { title: "Alumni", sub1: "Hall of Fame", sub2: "Past Debaters" },
            { title: "Debate Timer", sub1: "Launch App", sub2: "Settings" },
            { title: "Session", sub1: "Next Meet", sub2: "Resources" },
            { title: "Equity", sub1: "Guidelines", sub2: "Report" },
            { title: "Gallery", sub1: "Photos", sub2: "Videos" }
          ].flatMap((navItem, i) => [
            <div key={`full-${navItem.title}-1`} className="relative min-w-[300px] md:min-w-[450px] lg:min-w-[550px] h-full group flex-shrink-0 cursor-pointer overflow-hidden rounded border border-white/10 bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all z-10 duration-500"></div>
              <img
                src={`/event${(i % 2) + 1}.png`}
                alt={navItem.title}
                className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-110 group-hover:scale-105 transition-all duration-1000 ease-out"
              />
              <div className="absolute bottom-8 left-8 z-20 pr-8 transform group-hover:-translate-y-2 transition-transform duration-500">
                <h4 className="text-2xl md:text-4xl text-white font-light uppercase tracking-widest leading-snug drop-shadow-lg">
                  {navItem.title}:<br />
                  <span className="text-zinc-300 text-lg md:text-2xl">{navItem.sub1}</span>
                </h4>
              </div>
            </div>,
            <div key={`full-${navItem.title}-2`} className="relative min-w-[300px] md:min-w-[450px] lg:min-w-[550px] h-full group flex-shrink-0 cursor-pointer overflow-hidden rounded border border-white/10 bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all z-10 duration-500"></div>
              <img
                src={`/event${((i + 1) % 2) + 1}.png`}
                alt={navItem.title}
                className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-110 group-hover:scale-105 transition-all duration-1000 ease-out"
              />
              <div className="absolute bottom-8 left-8 z-20 pr-8 transform group-hover:-translate-y-2 transition-transform duration-500">
                <h4 className="text-2xl md:text-4xl text-white font-light uppercase tracking-widest leading-snug drop-shadow-lg">
                  {navItem.title}:<br />
                  <span className="text-zinc-300 text-lg md:text-2xl">{navItem.sub2}</span>
                </h4>
              </div>
            </div>
          ])}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </div>
  );
}
