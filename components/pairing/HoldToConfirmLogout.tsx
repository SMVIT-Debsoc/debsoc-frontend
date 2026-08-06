"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { LogOut } from "lucide-react";

const HOLD_DURATION_MS = 1200;

export default function HoldToConfirmLogout({
  collapsed = false,
  disabled = false,
  onConfirm,
}: {
  collapsed?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const holdingRef = useRef(false);

  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    startedAtRef.current = null;
    holdingRef.current = false;
    setHolding(false);
  }, []);

  const reset = useCallback(() => {
    stopTimer();
    setProgress(0);
  }, [stopTimer]);

  const start = useCallback(() => {
    if (holdingRef.current) return;
    holdingRef.current = true;
    startedAtRef.current = performance.now();
    setHolding(true);
    setProgress(0);
    intervalRef.current = window.setInterval(() => {
      const startedAt = startedAtRef.current;
      if (startedAt === null) return;
      const nextProgress = Math.min((performance.now() - startedAt) / HOLD_DURATION_MS, 1);
      setProgress(nextProgress);
      if (nextProgress >= 1) {
        stopTimer();
        setProgress(1);
        onConfirm();
      }
    }, reduceMotion ? 80 : 32);
  }, [onConfirm, reduceMotion, stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);
  /* eslint-disable react-hooks/set-state-in-effect -- cancel an in-progress confirmation when its control becomes disabled. */
  useEffect(() => {
    if (disabled) reset();
  }, [disabled, reset]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const finishKeyboardPress = () => {
    if (holdingRef.current) reset();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="Hold to log out"
      title="Hold to log out"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        start();
      }}
      onPointerUp={reset}
      onPointerCancel={reset}
      onPointerLeave={reset}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          reset();
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          start();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === "Enter" || event.key === " ") finishKeyboardPress();
      }}
      onBlur={reset}
      className={`relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-full border border-destructive/30 bg-destructive/10 px-4 text-sm font-semibold text-destructive backdrop-blur-md transition hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:cursor-not-allowed disabled:opacity-50 ${collapsed ? "w-11 shrink-0 px-0" : "w-full flex-1"}`}
    >
      <span className="hold-logout-progress pointer-events-none absolute inset-y-0 left-0 bg-destructive/20" style={{ width: `${progress * 100}%` }} aria-hidden="true" />
      <span className="relative z-10 inline-flex items-center gap-2">
        <LogOut size={16} aria-hidden="true" />
        {!collapsed && <span>{holding ? (progress >= 1 ? "Logging out…" : "Keep holding…") : "Hold to log out"}</span>}
      </span>
      <span className="sr-only" role="status" aria-live="polite">{holding ? "Keep holding to log out" : "Hold to log out"}</span>
      <span className="sr-only" role="progressbar" aria-label="Logout confirmation progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} />
    </button>
  );
}
