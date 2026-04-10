import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {Suspense} from "react";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "SMVIT DEBSOC",
    description: "Debate Society of SMVIT",
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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col" suppressHydrationWarning>
                <Suspense fallback={null}>
                    <Navbar />
                </Suspense>
                {children}
            </body>
        </html>
    );
}
