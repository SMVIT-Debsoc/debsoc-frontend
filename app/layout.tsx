import type { Metadata } from "next";
import { Lobster_Two, Lora, Prompt } from "next/font/google";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { authOptions, isAuthBuildPhase } from "@/auth";
import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const prompt = Prompt({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-prompt",
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
});

const lobsterTwo = Lobster_Two({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lobster-two",
  weight: ["400", "700"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: "/quote-image.jpg",
        width: 1200,
        height: 630,
        alt: "SMVIT DebSoc",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/quote-image.jpg"],
  },
  category: "education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/quote-image.jpg",
        type: "image/jpeg",
      },
    ],
    apple: [
      {
        url: "/quote-image.jpg",
        type: "image/jpeg",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = isAuthBuildPhase ? null : await getServerSession(authOptions);

  return (
    <html
      lang="en"
      className={`${prompt.variable} ${lora.variable} ${lobsterTwo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers session={session}>
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          {children}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
