"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  hasError
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  hasError?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <div className="relative" ref={ref}>
      <div
        className={`w-full bg-zinc-900 border ${hasError ? 'border-red-500/80 ring-1 ring-red-500/50' : isOpen ? 'border-white/30 ring-1 ring-white/30' : 'border-white/10'} rounded-xl px-4 py-3 pr-10 transition-all cursor-pointer flex items-center justify-between`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ color: value ? "white" : hasError ? "#fca5a5" : "#52525b" }}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown className={`absolute right-4 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${hasError ? 'text-red-400' : 'text-zinc-400'}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] top-[calc(100%+8px)] left-0 w-full bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col py-1"
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 cursor-pointer text-sm transition-colors hover:bg-white/10 ${value === opt.value ? 'bg-white/5 text-white' : 'text-zinc-300'}`}
              >
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HiringPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"poster" | "form" | "success">("poster");
  
  const [formData, setFormData] = useState({
    name: "",
    usn: "",
    year: "",
    branch: "",
    phone: "",
    position: "",
    isDayScholar: ""
  });

  const [errors, setErrors] = useState({
    year: false,
    position: false,
    isDayScholar: false
  });

  useEffect(() => {
    // Show popup shortly after load for better UX
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Reset after closing animation completes
    setTimeout(() => {
      setStep("poster");
      setFormData({ name: "", usn: "", year: "", branch: "", phone: "", position: "", isDayScholar: "" });
      setErrors({ year: false, position: false, isDayScholar: false });
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = {
      year: !formData.year,
      position: !formData.position,
      isDayScholar: !formData.isDayScholar
    };

    if (newErrors.year || newErrors.position || newErrors.isDayScholar) {
      setErrors(newErrors);
      return;
    }

    setErrors({ year: false, position: false, isDayScholar: false });

    // For now just simulate webhook call
    console.log("Form data for webhook:", formData);
    setStep("success");
    
    // Auto close after success
    setTimeout(() => {
      handleClose();
    }, 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={handleClose}
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md md:max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {step === "poster" && (
                <motion.div
                  key="poster"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col w-full h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {/* Poster Image Area */}
                  <div className="relative w-full aspect-[4/5] sm:aspect-square bg-zinc-900 overflow-hidden group cursor-pointer shrink-0" onClick={() => setStep("form")}>
                    {/* Placeholder for Hiring Poster */}
                    <img 
                      src="/quote-image.jpg" 
                      alt="Hiring Poster Placeholder" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
                    
                    <div className="absolute bottom-6 inset-x-0 flex flex-col items-center text-center px-6 pointer-events-none">
                      <h3 className="text-2xl font-light text-white tracking-wide mb-2 drop-shadow-lg">
                        WE ARE RECRUITING
                      </h3>
                      <p className="text-zinc-300 text-sm font-light">
                        Join the most intellectual society on campus.
                      </p>
                    </div>
                  </div>

                  {/* Call to action */}
                  <div className="p-6 bg-zinc-950 flex flex-col items-center justify-center gap-3 shrink-0">
                    <button
                      onClick={() => setStep("form")}
                      className="group flex items-center justify-between w-full max-w-[320px] px-6 py-4 bg-white text-black rounded-full hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <span className="font-medium text-sm tracking-wide uppercase">
                        Click me to start your journey with debsoc
                      </span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform ml-2 shrink-0" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "form" && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col p-8 sm:p-10 w-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  <div className="mb-8 text-center shrink-0">
                    <h3 className="text-2xl font-light text-white tracking-wide mb-2">
                      JOIN DEBSOC
                    </h3>
                    <p className="text-zinc-400 text-sm font-light">
                      Fill out your details to start your journey with us.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-5 shrink-0 pb-4">
                    <div className="space-y-1">
                      <label htmlFor="name" className="text-xs text-zinc-400 uppercase tracking-wider ml-1">Full Name</label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label htmlFor="usn" className="text-xs text-zinc-400 uppercase tracking-wider ml-1">USN</label>
                      <input
                        id="usn"
                        type="text"
                        required
                        value={formData.usn}
                        onChange={(e) => setFormData({...formData, usn: e.target.value})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all"
                        placeholder="1MV..."
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="space-y-1 w-1/2">
                        <label className="text-xs text-zinc-400 uppercase tracking-wider ml-1">Year</label>
                        <CustomSelect
                          value={formData.year}
                          onChange={(val) => {
                            setFormData({...formData, year: val});
                            if (errors.year) setErrors({...errors, year: false});
                          }}
                          placeholder="Select"
                          hasError={errors.year}
                          options={[
                            { value: "1", label: "1st Year" },
                            { value: "2", label: "2nd Year" },
                            { value: "3", label: "3rd Year" },
                            { value: "4", label: "4th Year" },
                          ]}
                        />
                      </div>
                      
                      <div className="space-y-1 w-1/2">
                        <label htmlFor="branch" className="text-xs text-zinc-400 uppercase tracking-wider ml-1">Branch</label>
                        <input
                          id="branch"
                          type="text"
                          required
                          value={formData.branch}
                          onChange={(e) => setFormData({...formData, branch: e.target.value})}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all"
                          placeholder="e.g. CSE, ECE"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="phone" className="text-xs text-zinc-400 uppercase tracking-wider ml-1">Phone Number</label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div className="space-y-1 z-20">
                      <label className="text-xs text-zinc-400 uppercase tracking-wider ml-1">Position you're applying for</label>
                      <CustomSelect
                        value={formData.position}
                        onChange={(val) => {
                          setFormData({...formData, position: val});
                          if (errors.position) setErrors({...errors, position: false});
                        }}
                        placeholder="Select Position"
                        hasError={errors.position}
                        options={[
                          { value: "Debater", label: "Debater" },
                          { value: "Video Editor", label: "Video Editor" },
                          { value: "Designer", label: "Designer" },
                          { value: "Tech", label: "Tech" },
                        ]}
                      />
                    </div>

                    <div className="space-y-1 z-10">
                      <label className="text-xs text-zinc-400 uppercase tracking-wider ml-1">Are you a Day Scholar?</label>
                      <CustomSelect
                        value={formData.isDayScholar}
                        onChange={(val) => {
                          setFormData({...formData, isDayScholar: val});
                          if (errors.isDayScholar) setErrors({...errors, isDayScholar: false});
                        }}
                        placeholder="Select Option"
                        hasError={errors.isDayScholar}
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                      />
                    </div>

                    <button
                      type="submit"
                      className="mt-6 w-full px-6 py-4 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all hover:scale-[1.01] active:scale-95 font-medium tracking-wide uppercase text-sm flex justify-center items-center gap-2"
                    >
                      Submit
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center p-12 text-center h-[400px]"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-20 h-20 text-white mb-6" />
                  </motion.div>
                  <h3 className="text-2xl font-light text-white tracking-wide mb-3">
                    WE GOT YOU!
                  </h3>
                  <p className="text-zinc-400 text-sm font-light leading-relaxed max-w-[250px]">
                    Your details have been submitted successfully. We will reach out to you soon.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
