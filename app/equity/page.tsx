import type { Metadata } from "next";
import EquityPolicy from "@/components/EquityPolicy";
import { buildPublicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicPageMetadata({
    title: "Equity Policy",
    description:
        "Read the official SMVIT DebSoc equity policy for respectful, inclusive, and fair debating spaces.",
    path: "/equity",
});

export default function EquityPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-slate-950">
            <EquityPolicy />
        </main>
    );
}
