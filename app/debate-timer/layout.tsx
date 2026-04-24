import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Debate Timer",
  description:
    "Use the SMVIT DebSoc debate timer for British Parliamentary and Asian Parliamentary rounds with clear speaking-time controls.",
  path: "/debate-timer",
});

export default function DebateTimerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
