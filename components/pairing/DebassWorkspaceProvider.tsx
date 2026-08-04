"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { debassClient, DebassApiError, hasDebassBackendUrl } from "@/lib/debass/client";
import { DEBASS_MODEL } from "@/lib/debass/types";

export type DebassHealthState = "Connected" | "Connecting" | "Disconnected" | "Unavailable";
export type DebassKeyState = "empty" | "validating" | "valid" | "invalid";

type DebassWorkspaceContextValue = {
  developmentMockEnabled: boolean;
  healthState: DebassHealthState;
  keyState: DebassKeyState;
  keyError: string | null;
  draftKey: string;
  acceptedKey: string | null;
  setDraftKey: (value: string) => void;
  validateKey: () => Promise<void>;
  clearKey: () => void;
  refreshHealth: () => Promise<void>;
  canUseDebass: boolean;
  model: string;
  assistantSessionVersion: number;
  clearAssistantSession: () => void;
};

const DebassWorkspaceContext = createContext<DebassWorkspaceContextValue | null>(null);

export default function DebassWorkspaceProvider({
  children,
  developmentMockEnabled,
}: {
  children: ReactNode;
  developmentMockEnabled: boolean;
}) {
  const backendConfigured = hasDebassBackendUrl();
  const [healthState, setHealthState] = useState<DebassHealthState>(developmentMockEnabled ? "Unavailable" : backendConfigured ? "Connecting" : "Unavailable");
  const [draftKey, setDraftKeyState] = useState("");
  const [acceptedKey, setAcceptedKey] = useState<string | null>(null);
  const [keyState, setKeyState] = useState<DebassKeyState>("empty");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [assistantSessionVersion, setAssistantSessionVersion] = useState(0);
  const validationController = useRef<AbortController | null>(null);

  useEffect(() => () => validationController.current?.abort(), []);

  const refreshHealth = useCallback(async () => {
    if (developmentMockEnabled || !backendConfigured) {
      setHealthState("Unavailable");
      return;
    }
    setHealthState("Connecting");
    const controller = new AbortController();
    try {
      const response = await debassClient.health(controller.signal);
      setHealthState(response.status === "ok" ? "Connected" : "Disconnected");
    } catch (caught) {
      if (!(caught instanceof DebassApiError && caught.kind === "cancelled")) setHealthState("Disconnected");
    }
  }, [backendConfigured, developmentMockEnabled]);

  useEffect(() => {
    if (developmentMockEnabled || !backendConfigured) return;
    const controller = new AbortController();
    void debassClient.health(controller.signal).then((response) => {
      if (response.status === "ok") setHealthState("Connected");
      else setHealthState("Disconnected");
    }).catch((caught) => {
      if (!(caught instanceof DebassApiError && caught.kind === "cancelled")) setHealthState("Disconnected");
    });
    return () => controller.abort();
  }, [backendConfigured, developmentMockEnabled]);

  const setDraftKey = useCallback((value: string) => {
    validationController.current?.abort();
    setDraftKeyState(value);
    setAcceptedKey(null);
    setKeyState("empty");
    setKeyError(null);
  }, []);

  const validateKey = useCallback(async () => {
    const candidate = draftKey.trim();
    if (!candidate) {
      setKeyState("invalid");
      setKeyError("Enter an OpenRouter key to continue.");
      return;
    }
    if (!candidate.startsWith("sk-or-v1-")) {
      setKeyState("invalid");
      setKeyError("OpenRouter keys should start with sk-or-v1-.");
      return;
    }
    validationController.current?.abort();
    setKeyState("validating");
    setKeyError(null);
    const controller = new AbortController();
    validationController.current = controller;
    try {
      const response = await debassClient.validateApiKey(candidate, controller.signal);
      if (controller.signal.aborted) return;
      if (response.status !== "success") {
        setAcceptedKey(null);
        setKeyState("invalid");
        setKeyError(response.message || "The Debass service did not accept this key.");
        return;
      }
      setAcceptedKey(candidate);
      setDraftKeyState(candidate);
      setKeyState("valid");
    } catch (caught) {
      if (controller.signal.aborted) return;
      setAcceptedKey(null);
      setKeyState("invalid");
      setKeyError(caught instanceof Error ? caught.message : "The key could not be validated.");
    } finally {
      if (validationController.current === controller) validationController.current = null;
    }
  }, [draftKey]);

  const clearKey = useCallback(() => {
    validationController.current?.abort();
    setDraftKeyState("");
    setAcceptedKey(null);
    setKeyState("empty");
    setKeyError(null);
  }, []);

  const clearAssistantSession = useCallback(() => {
    setAssistantSessionVersion((version) => version + 1);
  }, []);

  const value = useMemo<DebassWorkspaceContextValue>(() => ({
    developmentMockEnabled,
    healthState,
    keyState,
    keyError,
    draftKey,
    acceptedKey,
    setDraftKey,
    validateKey,
    clearKey,
    refreshHealth,
    canUseDebass: developmentMockEnabled || keyState === "valid",
    model: DEBASS_MODEL,
    assistantSessionVersion,
    clearAssistantSession,
  }), [acceptedKey, assistantSessionVersion, clearAssistantSession, clearKey, developmentMockEnabled, draftKey, healthState, keyError, keyState, refreshHealth, setDraftKey, validateKey]);

  return <DebassWorkspaceContext.Provider value={value}>{children}</DebassWorkspaceContext.Provider>;
}

export function useDebassWorkspace() {
  const context = useContext(DebassWorkspaceContext);
  if (!context) throw new Error("useDebassWorkspace must be used inside DebassWorkspaceProvider");
  return context;
}
