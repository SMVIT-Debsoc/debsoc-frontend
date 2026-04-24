import type { Metadata } from "next";
import SMVITPDChatPage from "@/components/smvitpd/SMVITPDChatPage";
import { buildPublicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicPageMetadata({
    title: "SMVIT PD Debate Assistant",
    description:
        "Use SMVIT PD, the SMVIT DebSoc debate assistant, for debate prep support, topic exploration, and argument structuring.",
    path: "/smvitpd",
    keywords: [
        "SMVIT PD",
        "SMVITPD",
        "SMVIT DebSoc",
        "debate assistant",
        "debate preparation",
    ],
});

export default function Page() {
    return <SMVITPDChatPage />;
}
