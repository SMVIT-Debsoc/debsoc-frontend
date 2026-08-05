"use client";

import RealMockJudgeWorkspace from "./RealMockJudgeWorkspace";

export default function MockJudgeWorkspace({ embedded = false }: { embedded?: boolean }) {
  return <RealMockJudgeWorkspace embedded={embedded} />;
}
