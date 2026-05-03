"use client";

import {useEffect, useState, useRef} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {X, ArrowRight, CheckCircle2, ChevronDown} from "lucide-react";

const QUESTIONS = [
  {id: 1, text: "If you could change one law in the Constitution, which one would it be?", type: "text"},
  {
    id: 2,
    text: "Do you think women sometimes receive extra privileges in the name of equality?",
    type: "choice",
    options: [
     "Yes",
     "No"
    ],
  },
  {id: 3, text: "Russia is right in its aggressive approach towards Ukraine due to circumstances.", type: "choice",
     options: [
      "Strongly Agree",
      "Agree",
      "Neutral",
      "Disagree",
      "Strongly Disagree"
     ]
  },
  {
    id: 4,
    text: "Feminism no longer aligns with its core agenda of bringing equality between the two genders.",
    type: "choice",
    options: [
      "Strongly agree",
      "Partially agree",
      "Partially disagree",
      "Strongly disagree"
    ]
  },
  {
    id: 5,
    text: "People who have committed extreme crimes should be sent for rehabilitation instead of receiving death penalties. Agree or disagree?",
    type: "choice",
    options: [
      "Agree",
      "Disagree"
    ]
  },
  {
    id: 6,
    text: "People in power (politicians, activists, celebrities) have higher moral responsibilities than others.",
    type: "choice",
    options: [
      "Yes",
      "No"
    ]
  },
  {
    id: 7,
    text: "Governments should spend more on education than defense.",
    type: "choice",
    options: [
      "Strongly agree",
      "Partially agree",
      "Partially disagree",
      "Strongly disagree"
    ]
  },
  {
    id: 8,
    text: "Social media has caused more harm than benefit to image/reputation of feminism.",
    type: "choice",
    options: [
      "Yes",
      "No"
    ]
  },
  {
    id: 9,
    text: "India's image outside of the country is currently something like “India is dirty”, “The streets in India are smelly”. DO you think western influencer has exaggerated it and if you change this mindset and how will you change it?",
    type: "text",
  },
  {
    id: 10,
    text: "If you were the President of the United States, would you have authorized military action against Iran? Why or why not? (brownie points : answer this one extra carefully)",
    type: "text",
  },
  {
    id : 11,
    text : "Give us one of your controversial opinions and why you think so. It'll be part of our discussions in subsequent rounds.",
    type : "text",
  }
];

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  hasError,
}: {
  value: string;
  onChange: (val: string) => void;
  options: {value: string; label: string}[];
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
        className={`w-full bg-zinc-900 border ${hasError ? "border-red-500/80 ring-1 ring-red-500/50" : isOpen ? "border-white/30 ring-1 ring-white/30" : "border-white/10"} rounded-xl px-4 py-3 pr-10 transition-all cursor-pointer flex items-center justify-between`}
        onClick={() => setIsOpen(!isOpen)}
        style={{color: value ? "white" : hasError ? "#fca5a5" : "#52525b"}}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown
          className={`absolute right-4 w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""} ${hasError ? "text-red-400" : "text-zinc-400"}`}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}}
            transition={{duration: 0.15}}
            className="absolute z-[100] top-[calc(100%+8px)] left-0 w-full bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col py-1"
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 cursor-pointer text-sm transition-colors hover:bg-white/10 ${value === opt.value ? "bg-white/5 text-white" : "text-zinc-300"}`}
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
  const [step, setStep] = useState<
    "poster" | "form" | "interstitial" | "quiz" | "success"
  >("poster");

  const [formData, setFormData] = useState({
    name: "",
    usn: "",
    year: "",
    branch: "",
    phone: "",
    position: "",
    isDayScholar: "",
  });

  const [errors, setErrors] = useState({
    year: false,
    position: false,
    isDayScholar: false,
  });

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizError, setQuizError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Show popup shortly after load for better UX
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto transition from interstitial to quiz
    if (step === "interstitial") {
      const timer = setTimeout(() => {
        setStep("quiz");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleClose = () => {
    setIsOpen(false);
    // Reset after closing animation completes
    setTimeout(() => {
      setStep("poster");
      setFormData({
        name: "",
        usn: "",
        year: "",
        branch: "",
        phone: "",
        position: "",
        isDayScholar: "",
      });
      setErrors({year: false, position: false, isDayScholar: false});
      setCurrentQuestionIdx(0);
      setAnswers({});
      setQuizError(false);
      setIsSubmitting(false);
    }, 500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      year: !formData.year,
      position: !formData.position,
      isDayScholar: !formData.isDayScholar,
    };

    if (newErrors.year || newErrors.position || newErrors.isDayScholar) {
      setErrors(newErrors);
      return;
    }

    setErrors({year: false, position: false, isDayScholar: false});

    // Instead of completing, move to the interstitial screen
    setStep("interstitial");
  };

  const handleNextQuestion = () => {
    const currentQ = QUESTIONS[currentQuestionIdx];
    if (!answers[currentQ.id] || answers[currentQ.id].trim() === "") {
      setQuizError(true);
      return;
    }
    setQuizError(false);

    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      // Format answers to include the actual question text for the Google Doc
      const formattedAnswers = QUESTIONS.map((q) => ({
        question: q.text,
        answer: answers[q.id] || "No answer provided",
      }));

      // Final submit of everything
      const finalPayload = {
        studentDetails: formData,
        answers: formattedAnswers,
      };

      setIsSubmitting(true);

      // Route through backend API to bypass browser CORS / preflight / redirect issues
      fetch("/api/applicants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalPayload),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("API returned an error");
          }
          return res.json();
        })
        .then(() => {
          setIsSubmitting(false);
          setStep("success");
          // Auto close after success
          setTimeout(() => {
            handleClose();
          }, 3000);
        })
        .catch((err) => {
          console.error("Error submitting application:", err);
          setIsSubmitting(false);
          alert(
            "There was an issue submitting your application. Please try again.",
          );
        });
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
      setQuizError(false); // Clear error state when going back
    }
  };

  const currentQ = QUESTIONS[currentQuestionIdx];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => {
              if (step === "poster" || step === "success") {
                handleClose();
              }
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{scale: 0.95, opacity: 0, y: 20}}
            animate={{scale: 1, opacity: 1, y: 0}}
            exit={{scale: 0.95, opacity: 0, y: 20}}
            transition={{type: "spring", damping: 25, stiffness: 300}}
            className="relative w-full max-w-md md:max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[92vh]"
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
                  initial={{opacity: 0, x: -20}}
                  animate={{opacity: 1, x: 0}}
                  exit={{opacity: 0, x: -20}}
                  className="flex flex-col w-full h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  <div
                    className="relative w-full aspect-[4/5] sm:aspect-square bg-zinc-900 overflow-hidden group cursor-pointer shrink-0"
                    onClick={() => setStep("form")}
                  >
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
                  initial={{opacity: 0, x: 20}}
                  animate={{opacity: 1, x: 0}}
                  exit={{opacity: 0, x: 20}}
                  className="flex flex-col p-6 sm:p-10 w-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  <div className="mb-8 text-center shrink-0">
                    <h3 className="text-2xl font-light text-white tracking-wide mb-2">
                      JOIN DEBSOC
                    </h3>
                    <p className="text-zinc-400 text-sm font-light">
                      Fill out your details to start your journey with us.
                    </p>
                  </div>

                  <form
                    onSubmit={handleFormSubmit}
                    className="flex flex-col gap-5 shrink-0 pb-4"
                  >
                    <div className="space-y-1">
                      <label
                        htmlFor="name"
                        className="text-xs text-zinc-400 uppercase tracking-wider ml-1"
                      >
                        Full Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({...formData, name: e.target.value})
                        }
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="usn"
                        className="text-xs text-zinc-400 uppercase tracking-wider ml-1"
                      >
                        USN
                      </label>
                      <input
                        id="usn"
                        type="text"
                        required
                        value={formData.usn}
                        onChange={(e) =>
                          setFormData({...formData, usn: e.target.value})
                        }
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all"
                        placeholder="1MV..."
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="space-y-1 w-1/2">
                        <label className="text-xs text-zinc-400 uppercase tracking-wider ml-1">
                          Year
                        </label>
                        <CustomSelect
                          value={formData.year}
                          onChange={(val) => {
                            setFormData({...formData, year: val});
                            if (errors.year)
                              setErrors({...errors, year: false});
                          }}
                          placeholder="Select"
                          hasError={errors.year}
                          options={[
                            {value: "1", label: "1st Year"},
                            {value: "2", label: "2nd Year"},
                            {value: "3", label: "3rd Year"},
                            {value: "4", label: "4th Year"},
                          ]}
                        />
                      </div>

                      <div className="space-y-1 w-1/2">
                        <label
                          htmlFor="branch"
                          className="text-xs text-zinc-400 uppercase tracking-wider ml-1"
                        >
                          Branch
                        </label>
                        <input
                          id="branch"
                          type="text"
                          required
                          value={formData.branch}
                          onChange={(e) =>
                            setFormData({...formData, branch: e.target.value})
                          }
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all"
                          placeholder="e.g. CSE, ECE"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="phone"
                        className="text-xs text-zinc-400 uppercase tracking-wider ml-1"
                      >
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({...formData, phone: e.target.value})
                        }
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div className="space-y-1 z-20">
                      <label className="text-xs text-zinc-400 uppercase tracking-wider ml-1">
                        Position you're applying for
                      </label>
                      <CustomSelect
                        value={formData.position}
                        onChange={(val) => {
                          setFormData({...formData, position: val});
                          if (errors.position)
                            setErrors({...errors, position: false});
                        }}
                        placeholder="Select Position"
                        hasError={errors.position}
                        options={[
                          {value: "Debater", label: "Debater"},
                          {value: "Video Editor", label: "Video Editor"},
                          {value: "Designer", label: "Designer"},
                          {value: "Tech", label: "Tech"},
                        ]}
                      />
                    </div>

                    <div className="space-y-1 z-10">
                      <label className="text-xs text-zinc-400 uppercase tracking-wider ml-1">
                        Are you a Day Scholar?
                      </label>
                      <CustomSelect
                        value={formData.isDayScholar}
                        onChange={(val) => {
                          setFormData({...formData, isDayScholar: val});
                          if (errors.isDayScholar)
                            setErrors({...errors, isDayScholar: false});
                        }}
                        placeholder="Select Option"
                        hasError={errors.isDayScholar}
                        options={[
                          {value: "Yes", label: "Yes"},
                          {value: "No", label: "No"},
                        ]}
                      />
                    </div>

                    <button
                      type="submit"
                      className="mt-6 w-full px-6 py-4 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all hover:scale-[1.01] active:scale-95 font-medium tracking-wide uppercase text-sm flex justify-center items-center gap-2"
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {step === "interstitial" && (
                <motion.div
                  key="interstitial"
                  initial={{opacity: 0, scale: 0.9, filter: "blur(4px)"}}
                  animate={{opacity: 1, scale: 1, filter: "blur(0px)"}}
                  exit={{opacity: 0, scale: 1.1, filter: "blur(4px)"}}
                  transition={{duration: 0.4}}
                  className="flex flex-col items-center justify-center p-12 text-center h-[500px]"
                >
                  <h3 className="text-3xl font-light text-white tracking-wide mb-4">
                    Fasten Your Seatbelts!
                  </h3>
                  <p className="text-zinc-400 text-sm md:text-base font-light leading-relaxed max-w-[280px]">
                    Here are {QUESTIONS.length} questions for you to showcase
                    your potential.
                  </p>

                  {/* Small loading indicator to show it's automatically transitioning */}
                  <div className="mt-8 flex gap-1">
                    <motion.div
                      animate={{opacity: [0.3, 1, 0.3]}}
                      transition={{repeat: Infinity, duration: 1.5, delay: 0}}
                      className="w-2 h-2 rounded-full bg-white/40"
                    />
                    <motion.div
                      animate={{opacity: [0.3, 1, 0.3]}}
                      transition={{repeat: Infinity, duration: 1.5, delay: 0.2}}
                      className="w-2 h-2 rounded-full bg-white/40"
                    />
                    <motion.div
                      animate={{opacity: [0.3, 1, 0.3]}}
                      transition={{repeat: Infinity, duration: 1.5, delay: 0.4}}
                      className="w-2 h-2 rounded-full bg-white/40"
                    />
                  </div>
                </motion.div>
              )}

              {step === "quiz" && (
                <motion.div
                  key="quiz-container"
                  initial={{opacity: 0, x: 20}}
                  animate={{opacity: 1, x: 0}}
                  exit={{opacity: 0, x: -20}}
                  className="flex flex-col p-6 sm:p-10 w-full h-[85vh] max-h-[620px]"
                >
                  <div className="flex-1 relative flex flex-col min-h-0">
                    <h4 className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-2 sm:mb-4 shrink-0">
                      Question {currentQuestionIdx + 1} of {QUESTIONS.length}
                    </h4>

                    <div className="relative flex-1 min-h-0">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`q-${currentQuestionIdx}`}
                          initial={{opacity: 0, x: 20}}
                          animate={{opacity: 1, x: 0}}
                          exit={{opacity: 0, x: -20}}
                          transition={{duration: 0.2}}
                          className="absolute inset-0 flex flex-col"
                        >
                          <h3 className="text-lg sm:text-xl md:text-2xl font-light text-white leading-snug mb-4 shrink-0">
                            {currentQ.text}
                          </h3>

                          {currentQ.type === "text" ? (
                            <textarea
                              value={answers[currentQ.id] || ""}
                              onChange={(e) => {
                                setAnswers({
                                  ...answers,
                                  [currentQ.id]: e.target.value,
                                });
                                if (quizError) setQuizError(false);
                              }}
                              className={`w-full flex-1 bg-zinc-900 border ${quizError ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10 focus:ring-white/30"} rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all min-h-[140px] resize-none`}
                              placeholder="Type your answer here..."
                            />
                          ) : (
                            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                              {currentQ.options?.map((opt) => {
                                const isSelected = answers[currentQ.id] === opt;
                                return (
                                  <div
                                    key={opt}
                                    onClick={() => {
                                      setAnswers({
                                        ...answers,
                                        [currentQ.id]: opt,
                                      });
                                      if (quizError) setQuizError(false);
                                    }}
                                    className={`px-4 py-4 rounded-xl border cursor-pointer transition-all ${isSelected ? "bg-white/10 border-white/40 text-white" : quizError ? "bg-zinc-900 border-red-500/40 text-red-200" : "bg-zinc-900 border-white/10 text-zinc-400 hover:bg-white/5"}`}
                                  >
                                    {opt}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="mt-8 shrink-0">
                    <div className="flex gap-3 mb-6">
                      {currentQuestionIdx > 0 && (
                        <button
                          onClick={handlePreviousQuestion}
                          disabled={isSubmitting}
                          className="px-6 py-4 bg-zinc-900 border border-white/10 text-zinc-300 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 font-medium tracking-wide uppercase text-sm flex justify-center items-center shrink-0"
                        >
                          Back
                        </button>
                      )}
                      <button
                        onClick={handleNextQuestion}
                        disabled={isSubmitting}
                        className={`flex-1 px-6 py-4 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all active:scale-95 font-medium tracking-wide uppercase text-sm flex justify-center items-center gap-2 ${isSubmitting ? "opacity-70 pointer-events-none" : ""}`}
                      >
                        {isSubmitting ? (
                          <>
                            Submitting{" "}
                            <motion.div
                              animate={{rotate: 360}}
                              transition={{
                                repeat: Infinity,
                                duration: 1,
                                ease: "linear",
                              }}
                              className="w-4 h-4 border-2 border-black border-t-transparent rounded-full ml-2"
                            />
                          </>
                        ) : currentQuestionIdx === QUESTIONS.length - 1 ? (
                          <>
                            Submit Application
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Next Question <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden flex">
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{
                          width: `${(currentQuestionIdx / QUESTIONS.length) * 100}%`,
                        }}
                        animate={{
                          width: `${((currentQuestionIdx + 1) / QUESTIONS.length) * 100}%`,
                        }}
                        transition={{duration: 0.3}}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{opacity: 0, scale: 0.9}}
                  animate={{opacity: 1, scale: 1}}
                  className="flex flex-col items-center justify-center p-12 text-center h-[500px]"
                >
                  <motion.div
                    initial={{scale: 0}}
                    animate={{scale: 1}}
                    transition={{type: "spring", damping: 15, delay: 0.1}}
                  >
                    <CheckCircle2 className="w-20 h-20 text-white mb-6" />
                  </motion.div>
                  <h3 className="text-2xl font-light text-white tracking-wide mb-3">
                    WE GOT YOU!
                  </h3>
                  <p className="text-zinc-400 text-sm font-light leading-relaxed max-w-[250px]">
                    Your application has been submitted successfully. We will
                    reach out to you soon.
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
