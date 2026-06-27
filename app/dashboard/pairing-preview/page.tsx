import { notFound } from "next/navigation";
import PairingDashboard from "@/components/pairing/PairingDashboard";

export const metadata = {
  title: "Pairing — Preview (dev only)",
  robots: { index: false, follow: false },
};

/**
 * DEV-ONLY preview route. Renders the pairing dashboard WITHOUT the auth
 * gate so the UI can be reviewed locally without OAuth.
 *
 * In production this route returns 404 — it never ships.
 *
 * Visit: http://localhost:3000/pairing-preview
 */
export default function PairingPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div>
      <div className="bg-amber-100 text-amber-900 text-xs px-4 py-1.5 text-center border-b border-amber-200">
        DEV preview — no auth gate. The real route is /dashboard/pairing.
      </div>
      <PairingDashboard />
    </div>
  );
}
