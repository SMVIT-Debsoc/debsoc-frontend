import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Gallery",
  description:
    "Explore photos and highlights from SMVIT DebSoc debates, sessions, and events.",
  path: "/gallery",
});

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
