import {Sparkles} from "lucide-react";
import {reviews, type Review} from "@/lib/alumni";

type AlumniSectionProps = {
    items?: Review[];
};

const fallbackData: Review[] = [
    {
        name: "ALUMNI NAME",
        position: "",
        text: "Add alumni entries in lib/alumni.ts. Each card renders only the name and description.",
    },
];

function AlumniCard({item, index}: {item: Review; index: number}) {
    return (
        <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-7 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-white/35 hover:bg-white/10">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-600">
                    Legacy Note {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                    {item.name}
                </h3>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-300">
                    {item.text}
                </p>
            </div>
        </article>
    );
}

export default function AlumniSection({items}: AlumniSectionProps) {
    const data =
        items && items.length > 0
            ? items
            : reviews.length > 0
              ? reviews
              : fallbackData;
    const marqueeData = [...data, ...data];
    const marqueeDuration = Math.max(42, data.length * 8);

    return (
        <section
            id="alumni"
            className="relative isolate overflow-hidden bg-[#000000] text-zinc-100 py-24 sm:py-28"
        >
            <div className="pointer-events-none absolute inset-0 opacity-45">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.08),transparent_38%),radial-gradient(circle_at_82%_25%,rgba(255,255,255,0.05),transparent_42%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.04),transparent_42%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.65),transparent_20%,transparent_80%,rgba(0,0,0,0.65))]" />
            </div>

            <div className="relative mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-14">
                <div className="mb-12 sm:mb-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.42em] text-zinc-600">
                            The Legacy Orators
                        </p>
                        <h2 className="mt-4 text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-[0.88]">
                            Alumni
                            <span className="block text-zinc-400">
                                Chronicles
                            </span>
                        </h2>
                        <div className="mt-6 h-px w-28 bg-white/60" />
                    </div>

                    <p className="max-w-md text-sm sm:text-base text-zinc-400 leading-relaxed">
                        A living archive of voices shaped by DEBSOC. Minimal by
                        design: each entry carries just a name and a lasting
                        idea.
                    </p>
                </div>
            </div>

            <div className="relative left-1/2 w-screen -translate-x-1/2">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 sm:w-24 bg-linear-to-r from-[#000000] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 sm:w-24 bg-linear-to-l from-[#000000] to-transparent" />

                <div className="overflow-hidden py-2">
                    <div
                        className="alumni-marquee-track flex w-max gap-5 sm:gap-6 px-2 sm:px-4"
                        style={{animationDuration: `${marqueeDuration}s`}}
                    >
                        {marqueeData.map((item, index) => (
                            <div
                                key={`${item.name}-${index}`}
                                className="w-80 sm:w-84 shrink-0"
                            >
                                <AlumniCard
                                    item={item}
                                    index={index % data.length}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="relative mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-14">
                <div className="mt-14 flex items-center justify-between border-t border-white/10 pt-6">
                    <p className="text-[10px] uppercase tracking-[0.34em] text-zinc-600">
                        Archive Count {String(data.length).padStart(2, "0")}
                    </p>
                    <div className="inline-flex items-center gap-2 text-zinc-500">
                        <Sparkles className="h-4 w-4" strokeWidth={1.4} />
                        <span className="text-[10px] uppercase tracking-[0.24em]">
                            SMVIT Debsoc
                        </span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes alumni-marquee-left {
                    0% {
                        transform: translate3d(0, 0, 0);
                    }
                    100% {
                        transform: translate3d(-50%, 0, 0);
                    }
                }

                .alumni-marquee-track {
                    animation-name: alumni-marquee-left;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                    will-change: transform;
                }

                .alumni-marquee-track:hover,
                .alumni-marquee-track:focus-within {
                    animation-play-state: paused;
                }

                @media (prefers-reduced-motion: reduce) {
                    .alumni-marquee-track {
                        animation: none !important;
                    }
                }
            `}</style>
        </section>
    );
}
