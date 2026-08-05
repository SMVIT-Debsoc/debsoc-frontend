"use client";

import RealMockDrillWorkspace from "./RealMockDrillWorkspace";

export default function MockDrillWorkspace({ embedded = false }: { embedded?: boolean }) {
  return <RealMockDrillWorkspace embedded={embedded} />;
}
