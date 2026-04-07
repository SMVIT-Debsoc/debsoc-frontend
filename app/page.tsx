"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const HomeClient = dynamic(() => import("@/components/Home"), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-black flex items-center justify-center text-white">Loading Experience...</div>}>
      <HomeClient />
    </Suspense>
  );
}