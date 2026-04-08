import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface WhyChooseDebsocProps {
  isWhyChooseOpen: boolean;
  whyChooseRef: React.RefObject<HTMLDivElement | null>;
}

export default function WhyChooseDebsoc({ isWhyChooseOpen, whyChooseRef }: WhyChooseDebsocProps) {
  return (
    <div
      ref={whyChooseRef}
      className={`absolute top-full left-0 w-full h-screen overflow-y-auto bg-black flex flex-col items-center justify-start px-8 pt-24 pb-24 z-50 text-white hide-scrollbar`}
    >
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center relative">
        <h2 className="text-3xl md:text-5xl lg:text-7xl font-bold uppercase tracking-tighter mb-4 text-center leading-none">
          <TypewriterText text="Why Choose" active={isWhyChooseOpen} />
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 via-zinc-500 to-zinc-700">
            Debsoc
          </span>
        </h2>
        <p className="text-zinc-400 text-sm md:text-lg mb-16 text-center max-w-2xl font-light">
          We are more than just a debating society. We are a crucible for leadership, critical thinking, and the relentless pursuit of truth through discourse.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[
            {
              title: "Elite Network",
              desc: "Connect with the sharpest minds. Our alumni network spans top universities, legal firms, and global think tanks.",
            },
            {
              title: "Premier Tournaments",
              desc: "Compete at the highest level. We regularly host and participate in internationally recognized competitions.",
            },
            {
              title: "The Art of Persuasion",
              desc: "Master the spoken word. We provide rigorous training in logic, rhetoric, and public speaking.",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className={`flex flex-col items-start justify-between bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-8 rounded block transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isWhyChooseOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
              }`}
              style={{ transitionDelay: `${500 + i * 150}ms` }}
            >
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-12 bg-white/[0.02]">
                <Sparkles size={16} className="text-zinc-300" />
              </div>
              <div>
                <h3 className="text-xl font-medium tracking-wide mb-3">{feature.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TypewriterText = ({ text, active }: { text: string; active: boolean }) => {
  const [displayed, setDisplayed] = useState("");
  
  useEffect(() => {
    if (!active) {
      setDisplayed("");
      return;
    }
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
  }, [text, active]);

  return (
    <span className="inline-block relative">
      {displayed}
      <span className="animate-pulse font-light ml-1 absolute bottom-0">_</span>
    </span>
  );
};
