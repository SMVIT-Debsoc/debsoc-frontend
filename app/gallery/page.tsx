"use client";

import {useRef} from "react";
import GallerySection from "@/components/GallerySection";

export default function GalleryPage() {
    const galleryRef = useRef<HTMLDivElement>(null);

    return (
        <main className="min-h-screen bg-black pt-20 md:pt-24">
            <GallerySection
                isGalleryOpen={true}
                galleryRef={galleryRef}
                standalone={true}
            />
        </main>
    );
}
