"use client";

export const ASSISTANT_SETTINGS_OPEN_EVENT = "debsoc:open-assistant-settings";

export function requestAssistantSettingsOpen() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ASSISTANT_SETTINGS_OPEN_EVENT));
}
