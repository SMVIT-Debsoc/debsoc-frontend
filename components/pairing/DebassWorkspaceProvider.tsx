"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { debassClient, DebassApiError, hasDebassBackendUrl } from "@/lib/debass/client";
import { DEBASS_MODEL } from "@/lib/debass/types";
import { readRememberedDebassKey, removeRememberedDebassKey, writeRememberedDebassKey } from "@/lib/debass/device-key";

export type DebassHealthState = "Connected" | "Connecting" | "Disconnected" | "Unavailable";
export type DebassKeyState = "empty" | "validating" | "valid" | "invalid";

type DebassWorkspaceContextValue = {
  healthState: DebassHealthState;
  keyState: DebassKeyState;
  keyError: string | null;
  storageError: string | null;
  draftKey: string;
  acceptedKey: string | null;
  rememberKey: boolean;
  hasRememberedKey: boolean;
  setDraftKey: (value: string) => void;
  setRememberKey: (value: boolean) => void;
  removeRememberedKey: () => void;
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
}: {
  children: ReactNode;
}) {
  const backendConfigured = hasDebassBackendUrl();
  const [healthState, setHealthState] = useState<DebassHealthState>(backendConfigured ? "Connecting" : "Unavailable");
  const [draftKey, setDraftKeyState] = useState("");
  const [acceptedKey, setAcceptedKey] = useState<string | null>(null);
  const [keyState, setKeyState] = useState<DebassKeyState>("empty");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [rememberKey, setRememberKeyState] = useState(false);
  const [hasRememberedKey, setHasRememberedKey] = useState(false);
  const [assistantSessionVersion, setAssistantSessionVersion] = useState(0);
  const validationController = useRef<AbortController | null>(null);
  const rememberKeyRef = useRef(false);

  useEffect(() => () => validationController.current?.abort(), []);

  useEffect(() => {
    const rememberedKey = readRememberedDebassKey();
    if (!rememberedKey) return;

    const restoreTimer = window.setTimeout(() => {
      rememberKeyRef.current = true;
      setRememberKeyState(true);
      setHasRememberedKey(true);
      setDraftKeyState(rememberedKey);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  const refreshHealth = useCallback(async () => {
    if (!backendConfigured) {
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
  }, [backendConfigured]);

  useEffect(() => {
    if (!backendConfigured) return;
    const controller = new AbortController();
    void debassClient.health(controller.signal).then((response) => {
      if (response.status === "ok") setHealthState("Connected");
      else setHealthState("Disconnected");
    }).catch((caught) => {
      if (!(caught instanceof DebassApiError && caught.kind === "cancelled")) setHealthState("Disconnected");
    });
    return () => controller.abort();
  }, [backendConfigured]);

  const setDraftKey = useCallback((value: string) => {
    validationController.current?.abort();
    setDraftKeyState(value);
    setAcceptedKey(null);
    setKeyState("empty");
    setKeyError(null);
    setStorageError(null);
  }, []);

  const setRememberKey = useCallback((value: boolean) => {
    rememberKeyRef.current = value;
    setStorageError(null);

    if (value) {
      setRememberKeyState(true);
      return;
    }

    if (!removeRememberedDebassKey()) {
      rememberKeyRef.current = true;
      setRememberKeyState(true);
      setStorageError("This browser blocked device storage. The saved key was not removed.");
      return;
    }

    setRememberKeyState(false);
    setHasRememberedKey(false);
  }, []);

  const removeRememberedKey = useCallback(() => {
    if (!removeRememberedDebassKey()) {
      setStorageError("This browser blocked device storage. The saved key was not removed.");
      return;
    }

    rememberKeyRef.current = false;
    setRememberKeyState(false);
    setHasRememberedKey(false);
    setStorageError(null);
  }, []);

  const validateCandidate = useCallback(async (rawCandidate: string) => {
    const candidate = rawCandidate.trim();
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
      if (rememberKeyRef.current) {
        if (writeRememberedDebassKey(candidate)) {
          setHasRememberedKey(true);
          setStorageError(null);
        } else {
          setStorageError("This browser blocked device storage. The key will stay in memory for this session.");
        }
      }
    } catch (caught) {
      if (controller.signal.aborted) return;
      setAcceptedKey(null);
      setKeyState("invalid");
      setKeyError(caught instanceof Error ? caught.message : "The key could not be validated.");
    } finally {
      if (validationController.current === controller) validationController.current = null;
    }
  }, []);

  const validateKey = useCallback(async () => validateCandidate(draftKey), [draftKey, validateCandidate]);

  const clearKey = useCallback(() => {
    validationController.current?.abort();
    setDraftKeyState("");
    setAcceptedKey(null);
    setKeyState("empty");
    setKeyError(null);
    setStorageError(null);
  }, []);

  const clearAssistantSession = useCallback(() => {
    setAssistantSessionVersion((version) => version + 1);
  }, []);

  const value = useMemo<DebassWorkspaceContextValue>(() => ({
    healthState,
    keyState,
    keyError,
    storageError,
    draftKey,
    acceptedKey,
    rememberKey,
    hasRememberedKey,
    setDraftKey,
    setRememberKey,
    removeRememberedKey,
    validateKey,
    clearKey,
    refreshHealth,
    canUseDebass: keyState === "valid",
    model: DEBASS_MODEL,
    assistantSessionVersion,
    clearAssistantSession,
  }), [acceptedKey, assistantSessionVersion, clearAssistantSession, clearKey, draftKey, hasRememberedKey, healthState, keyError, keyState, rememberKey, refreshHealth, removeRememberedKey, setDraftKey, setRememberKey, storageError, validateKey]);

  return <DebassWorkspaceContext.Provider value={value}>{children}</DebassWorkspaceContext.Provider>;
}

export function useDebassWorkspace() {
  const context = useContext(DebassWorkspaceContext);
  if (!context) throw new Error("useDebassWorkspace must be used inside DebassWorkspaceProvider");
  return context;
}
