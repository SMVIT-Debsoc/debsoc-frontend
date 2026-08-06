"use client";

import { useId, type ChangeEvent, type KeyboardEvent } from "react";
import { Minus, Plus } from "lucide-react";

type ElasticSliderProps = {
  value: number | null;
  min: number;
  max: number;
  step: number;
  onValueChange: (nextValue: number) => void;
  ariaLabel: string;
  disabled?: boolean;
  error?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function precisionFor(step: number) {
  const decimal = step.toString().split(".")[1];
  return decimal ? decimal.length : 0;
}

function snap(value: number, min: number, max: number, step: number) {
  const precision = precisionFor(step);
  const snapped = min + Math.round((clamp(value, min, max) - min) / step) * step;
  return Number(clamp(snapped, min, max).toFixed(precision));
}

function formatValue(value: number, step: number) {
  return value.toFixed(Math.max(1, precisionFor(step)));
}

export default function ElasticSlider({
  value,
  min,
  max,
  step,
  onValueChange,
  ariaLabel,
  disabled = false,
  error = false,
}: ElasticSliderProps) {
  const inputId = useId();
  const resolvedValue = value === null ? min : snap(value, min, max, step);
  const percentage = max === min ? 0 : ((resolvedValue - min) / (max - min)) * 100;
  const pageStep = Math.max(step, (max - min) / 10);

  const changeValue = (nextValue: number) => {
    onValueChange(snap(nextValue, min, max, step));
  };

  const handleRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
    changeValue(Number(event.target.value));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    let nextValue: number | null = null;
    if (event.key === "ArrowUp" || event.key === "ArrowRight") nextValue = resolvedValue + step;
    if (event.key === "ArrowDown" || event.key === "ArrowLeft") nextValue = resolvedValue - step;
    if (event.key === "PageUp") nextValue = resolvedValue + pageStep;
    if (event.key === "PageDown") nextValue = resolvedValue - pageStep;
    if (event.key === "Home") nextValue = min;
    if (event.key === "End") nextValue = max;
    if (nextValue === null) return;
    event.preventDefault();
    changeValue(nextValue);
  };

  const nudge = (direction: -1 | 1) => changeValue(resolvedValue + direction * step);
  const valueText = value === null ? `No score selected. Minimum score is ${formatValue(min, step)}.` : `Score ${formatValue(resolvedValue, step)}`;

  return (
    <div className={`elastic-slider min-w-0 rounded-xl border p-2.5 ${error ? "border-destructive/60 bg-destructive/5" : "border-border/80 bg-muted/20"}`}>
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-[11px] font-medium text-muted-foreground">Fine-tune score</span>
        <output htmlFor={`${inputId}-range`} className="text-xs font-semibold tabular-nums text-muted-foreground" aria-live="polite">
          {value === null ? "—" : formatValue(resolvedValue, step)}
        </output>
      </div>
      <div className="mt-1 flex min-w-0 items-center gap-1.5">
        <button type="button" onClick={() => nudge(-1)} disabled={disabled || resolvedValue <= min} aria-label={`Decrease ${ariaLabel}`} title={`Decrease ${ariaLabel}`} className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none">
          <Minus size={16} aria-hidden="true" />
        </button>
        <input
          id={`${inputId}-range`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={resolvedValue}
          onChange={handleRangeChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label={`Fine-tune ${ariaLabel}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={resolvedValue}
          aria-valuetext={valueText}
          className="elastic-slider-range h-10 min-w-0 flex-1 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          style={{ background: `linear-gradient(to right, var(--primary) ${percentage}%, var(--muted) ${percentage}%)` }}
        />
        <button type="button" onClick={() => nudge(1)} disabled={disabled || resolvedValue >= max} aria-label={`Increase ${ariaLabel}`} title={`Increase ${ariaLabel}`} className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none">
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      <p className="mt-1 px-1 text-[10px] text-muted-foreground">Adjust by {formatValue(step, step)} points</p>
    </div>
  );
}
