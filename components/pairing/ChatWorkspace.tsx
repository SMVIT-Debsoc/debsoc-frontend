"use client";

import RealChatWorkspace from "./RealChatWorkspace";

export default function ChatWorkspace({ embedded = false }: { embedded?: boolean }) {
  return <RealChatWorkspace embedded={embedded} />;
}
