import type { Metadata } from "next";
import Script from "next/script";

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
      {children}
    </>
  );
}
