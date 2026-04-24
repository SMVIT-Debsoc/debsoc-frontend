import type { Metadata } from "next";
import SMVITPDChatPage from "@/components/smvitpd/SMVITPDChatPage";
import { buildPublicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPublicPageMetadata({
    title: "SMVITPD Assistant",
    description:
        "Use the SMVITPD assistant for debate prep support, topic exploration, and argument structuring.",
    path: "/smvitpd",
});

export default function Page() {
    return <SMVITPDChatPage />;
}
