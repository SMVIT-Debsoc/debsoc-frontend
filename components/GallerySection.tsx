"use client";

import React, {useRef, useState} from "react";
import Image from "next/image";
import {ArrowUpRight, Play, Maximize2, X} from "lucide-react";
import gsap from "gsap";
import {useGSAP} from "@gsap/react";

interface GalleryItem {
    id: string;
    title: string;
    category: string;
    image: string;
    colSpan: number;
    rowSpan: number;
}

const GALLERY_ITEMS: GalleryItem[] = [
    {
        id: "G1",
        title: "National Debate Finals",
        category: "Tournament",
        image: "/event1.png",
        colSpan: 2,
        rowSpan: 2,
    },
    {
        id: "G2",
        title: "Team Strategy Session",
        category: "Behind the Scenes",
        image: "/quote-image.jpg",
        colSpan: 1,
        rowSpan: 1,
    },
    {
        id: "G3",
        title: "Award Ceremony",
        category: "Milestone",
        image: "/event2.png",
        colSpan: 1,
        rowSpan: 2,
    },
    {
        id: "G4",
        title: "Guest Speaker Panel",
        category: "Event",
        image: "/mic.png",
        colSpan: 1,
        rowSpan: 1,
    },
    {
        id: "G5",
        title: "Late Night Prep",
        category: "Behind the Scenes",
        image: "/event1.png",
        colSpan: 1,
        rowSpan: 1,
    },
    {
        id: "G6",
        title: "Opening Ceremony",
        category: "Event",
        image: "/event2.png",
        colSpan: 1,
        rowSpan: 1,
    },
];

interface GallerySectionProps {
    isGalleryOpen: boolean;
    galleryRef: React.RefObject<HTMLDivElement | null>;
}

export default function GallerySection({
    isGalleryOpen,
    galleryRef,
}: GallerySectionProps) {
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(
        null,
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const internalScrollRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = galleryRef || internalScrollRef;

    useGSAP(
        () => {
            if (!isGalleryOpen) return;

            const tl = gsap.timeline();

            tl.fromTo(
                ".gallery-header span",
                {y: 50, opacity: 0},
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    stagger: 0.1,
                    ease: "power4.out",
                },
            );

            tl.fromTo(
                ".gallery-item",
                {y: 50, opacity: 0, scale: 0.95},
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 1.2,
                    stagger: 0.1,
                    ease: "power3.out",
                },
                "-=0.6",
            );
        },
        {dependencies: [isGalleryOpen], scope: containerRef},
    );

    return (
        <div
            ref={containerRef}
            className={`absolute left-0 w-full h-screen overflow-hidden bg-[#000000] flex flex-col z-50 text-white transition-opacity duration-1000 ${isGalleryOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{top: "500%"}}
        >
            <div className="absolute top-1/4 -right-1/4 text-[10rem] md:text-[20rem] font-black text-white/2 leading-none pointer-events-none select-none whitespace-nowrap z-0 transform rotate-90 origin-right">
                VISUALS
            </div>

            <div className="absolute top-0 left-0 w-full flex justify-between items-center p-8 md:px-12 z-30 pointer-events-none">
                <span className="text-[9px] md:text-xs tracking-[0.4em] uppercase text-zinc-500 font-light mix-blend-difference">
                    Moments / Archives / 2026
                </span>
                <span className="text-[9px] md:text-xs tracking-[0.2em] uppercase text-zinc-600 font-light mix-blend-difference">
                    Visual Cortex
                </span>
            </div>

            <div className="w-full h-full px-8 md:px-12 pb-12 z-10 flex flex-col pt-24 md:pt-32">
                <div className="gallery-header mb-8 md:mb-12 shrink-0 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <h1 className="text-[3rem] md:text-[5rem] lg:text-[6.5rem] font-black leading-none tracking-[-0.04em] uppercase text-white flex flex-wrap gap-x-4">
                        <span className="inline-block overflow-hidden">
                            <span className="inline-block">THE</span>
                        </span>
                        <span className="inline-block overflow-hidden text-zinc-500">
                            <span className="inline-block">GALLERY</span>
                        </span>
                    </h1>
                    <div className="max-w-md lg:pb-3">
                        <p className="text-zinc-400 text-sm md:text-base font-light leading-relaxed tracking-wide">
                            A curated collection of moments, capturing the
                            intensity, strategy, and triumph of our debaters
                            across the globe.
                        </p>
                    </div>
                </div>

                <div
                    ref={scrollContainerRef}
                    className="flex-1 w-full overflow-y-auto hide-scrollbar pb-16"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 auto-rows-[200px] md:auto-rows-[250px] gap-4 md:gap-6">
                        {GALLERY_ITEMS.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedImage(item)}
                                className={`gallery-item relative group overflow-hidden bg-zinc-900 border border-white/5 cursor-pointer rounded-sm hover:-translate-y-1 transition-transform duration-500
                                    ${item.colSpan === 2 ? "md:col-span-2" : "col-span-1"}
                                    ${item.rowSpan === 2 ? "row-span-2" : "row-span-1"}
                                `}
                            >
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-all duration-1200 group-hover:scale-105 ease-out"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-700" />
                                <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-700" />

                                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                    <div className="flex justify-between items-start opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 bg-white/10 px-2 py-1 rounded backdrop-blur-md">
                                            {item.category}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedImage(item);
                                            }}
                                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all hover:scale-110"
                                        >
                                            <Maximize2
                                                size={14}
                                                className="text-white"
                                            />
                                        </button>
                                    </div>

                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <h3 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white mb-2 leading-tight">
                                            {item.title}
                                        </h3>
                                        <div className="w-full h-px bg-white/20 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-12"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 md:top-12 md:right-12 text-white/70 hover:text-white z-50 p-2 transition-colors"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={32} />
                    </button>
                    <div
                        className="relative w-full h-full max-w-6xl max-h-[85vh] rounded-lg overflow-hidden border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={selectedImage.image}
                            alt={selectedImage.title}
                            fill
                            className="object-contain"
                        />
                        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 bg-linear-to-t from-black via-black/60 to-transparent pointer-events-none">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 bg-white/10 px-2 py-1 rounded backdrop-blur-md mb-3 inline-block">
                                {selectedImage.category}
                            </span>
                            <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                                {selectedImage.title}
                            </h2>
                        </div>
                    </div>
                </div>
            )}

            <style
                dangerouslySetInnerHTML={{
                    __html: `.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`,
                }}
            />
        </div>
    );
}
