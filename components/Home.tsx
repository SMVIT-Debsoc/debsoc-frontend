"use client";

import {useEffect, useRef} from "react";
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

  useGSAP(
    () => {
      if (!containerRef.current) return;

      // We can preserve the horizontal scrolling logic if needed later,
      // but for now let's focus on animating in the elements of this specific hero section
      gsap.from(".hero-text", {
        y: 50,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.2,
      });

      gsap.from(".mission-box", {
        x: 50,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.5,
      });

      gsap.from(".event-card", {
        x: 50,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.2,
        delay: 0.7,
      });

      gsap.from(".mic-image", {
        y: 30,
        opacity: 0,
        duration: 1.5,
        ease: "power2.out",
      });
    },
    {scope: containerRef},
  );

  return (
    <div
      className="bg-[#000000] text-zinc-100 font-sans min-h-screen overflow-hidden selection:bg-white/20 selection:text-white"
      ref={containerRef}
    >
      {/* Top Navbar */}
      <nav className="absolute top-0 w-full flex justify-between items-center p-8 md:px-12 z-50">
        <div className="flex items-center gap-1 font-light tracking-widest text-xl uppercase">
          <Sparkles size={18} strokeWidth={1} className="text-white" />
          DEBSOC
        </div>
        <button className="text-white opacity-80 hover:opacity-100 transition-opacity">
          <Menu size={28} strokeWidth={1} />
        </button>
      </nav>

      {/* Main Container */}
      <div className="relative w-full h-screen flex">
        {/* Background Mic Image */}
        <div className="absolute inset-0 z-0 flex items-center justify-center md:justify-start md:left-[10%] opacity-90 mic-image pointer-events-none">
          <img
            src="/mic.png"
            alt="Silver Retro Microphone"
            className="h-[80vh] md:h-[100vh] w-auto object-contain object-bottom drop-shadow-2xl opacity-80 mix-blend-screen"
          />
        </div>

        {/* Bottom Left Titling */}
        <div className="absolute bottom-12 md:bottom-20 left-8 md:left-12 z-20 flex flex-col pointer-events-none">
          <h1 className="hero-text text-[3rem] md:text-[5.5rem] lg:text-[7rem] font-light leading-[1.1] tracking-tight text-white mb-2 max-w-4xl">
            DEBSOC:
            <br />
            <span className="text-zinc-300">THE ART OF ARGUMENT.</span>
          </h1>
          <p className="hero-text text-sm md:text-lg text-zinc-400 font-light max-w-md mt-2 tracking-wide leading-relaxed">
            A high-end production studio for <br />
            discourse and debate.
          </p>
        </div>

        {/* Right Side Content Container */}
        <div className="absolute top-0 right-0 w-full md:w-[50%] h-full flex flex-col justify-center items-end p-8 md:pr-12 md:pl-0 z-10">
          {/* Mission Box & Events Row */}
          <div className="flex flex-col md:flex-row items-start justify-end gap-12 w-full mt-24">
            {/* Mission Box */}
            <div className="mission-box bg-white/[0.02] backdrop-blur-xl border border-white/5 p-8 rounded block w-[300px] h-fit md:mt-24 shadow-2xl">
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

            {/* Events Section */}
            <div className="flex flex-col w-full md:w-[450px]">
              <h3 className="text-zinc-200 text-lg tracking-[0.1em] mb-6 uppercase font-light">
                Events
              </h3>

              {/* Event Cards Scroll Container */}
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar w-full relative">
                {/* Event 1 */}
                <div className="event-card relative min-w-[280px] h-[160px] group cursor-pointer overflow-hidden rounded-sm border border-white/10 bg-zinc-900">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
                  <img
                    src="/event1.png"
                    alt="Event 1"
                    className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700"
                  />
                  <div className="absolute bottom-4 left-4 z-20 pr-4">
                    <h4 className="text-sm text-white font-light uppercase tracking-wider leading-snug">
                      The Great Debate:
                      <br />
                      2024 Finals
                    </h4>
                  </div>

                  {/* Hover View Button */}
                  <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/80 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 text-black text-xs font-medium translate-y-4 group-hover:translate-y-0 transition-all">
                      <X size={14} /> View
                    </div>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="event-card relative min-w-[280px] h-[160px] group cursor-pointer overflow-hidden rounded-sm border border-white/10 bg-zinc-900">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
                  <img
                    src="/event2.png"
                    alt="Event 2"
                    className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700"
                  />
                  <div className="absolute bottom-4 left-4 z-20 pr-4">
                    <h4 className="text-sm text-white font-light uppercase tracking-wider leading-snug">
                      Speech Craft:
                      <br />
                      Masterclass
                    </h4>
                  </div>

                  {/* Hover View Button */}
                  <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/80 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 text-black text-xs font-medium translate-y-4 group-hover:translate-y-0 transition-all">
                      <X size={14} /> View
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="absolute bottom-8 right-8 md:right-12 z-20 flex gap-6 text-xs text-zinc-400 font-light tracking-wider">
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
