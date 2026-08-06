import type { Metadata } from "next";
import Script from "next/script";
import AmbientConstellations from "@/components/pairing/AmbientConstellations";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// Applies the saved dashboard theme before first paint to avoid a flash of
// the wrong theme. "system" (or no saved value) follows prefers-color-scheme.
const themeInitScript = `(function(){try{var t=localStorage.getItem("debsoc-theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script id="theme-init" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      <div className="relative min-h-screen">
        <div aria-hidden="true" className="dashboard-background pointer-events-none fixed inset-0 z-0" />
        <AmbientConstellations />
        <div className="relative z-10 min-h-screen">{children}</div>
      </div>
    </>
  );
}
