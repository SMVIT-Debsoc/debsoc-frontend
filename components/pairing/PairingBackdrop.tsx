"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
};

const MAX_DELTA_SECONDS = 0.05;
const PARTICLE_SPEED_SCALE = 1.2;
const POINTER_FOLLOW_RATE = 4;
const ACTIVITY_DECAY_RATE = 4;
const IDLE_WAVE_RATE = 0.2;

export default function PairingBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let animationFrame: number | null = null;
    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;
    let lastTime = 0;
    let paused = document.visibilityState === "hidden";
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let mounted = true;
    const pointer = { x: 0.5, y: 0.45, targetX: 0.5, targetY: 0.45 };
    const activity = { x: 0.5, y: 0.45, energy: 0 };
    const particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      const count = width < 640 ? 22 : 48;
      particles.splice(count);
      while (particles.length < count) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 10 * PARTICLE_SPEED_SCALE,
          vy: (Math.random() - 0.5) * 7 * PARTICLE_SPEED_SCALE,
          r: 1 + Math.random() * 1.8,
          phase: Math.random() * Math.PI * 2,
        });
      }
      if (reducedMotion && !paused && mounted) draw(performance.now());
    };

    const setPointerTarget = (clientX: number, clientY: number) => {
      if (reducedMotion) return;
      pointer.targetX = clientX / Math.max(window.innerWidth, 1);
      pointer.targetY = clientY / Math.max(window.innerHeight, 1);
    };

    const onPointerMove = (event: PointerEvent) => {
      setPointerTarget(event.clientX, event.clientY);
    };

    const onActivity = (event: KeyboardEvent) => {
      if (reducedMotion || ["Shift", "Control", "Alt", "Meta", "Tab", "Escape"].includes(event.key)) return;
      activity.x = pointer.targetX;
      activity.y = pointer.targetY;
      activity.energy = 1;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (reducedMotion) return;
      setPointerTarget(event.clientX, event.clientY);
      activity.x = event.clientX / Math.max(window.innerWidth, 1);
      activity.y = event.clientY / Math.max(window.innerHeight, 1);
      activity.energy = 1;
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      reducedMotion = motionQuery.matches;
      activity.energy = 0;
      lastTime = 0;
      if (reducedMotion) {
        if (animationFrame !== null) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        draw(performance.now());
      } else {
        if (reducedMotion) draw(performance.now());
        else scheduleFrame();
      }
    };

    const scheduleFrame = () => {
      if (!mounted || paused || reducedMotion || animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      paused = document.visibilityState === "hidden";
      if (paused) {
        if (animationFrame !== null) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        lastTime = 0;
      } else {
        scheduleFrame();
      }
    };

    const draw = (time: number) => {
      animationFrame = null;
      if (!mounted || paused) return;

      const deltaSeconds = lastTime === 0
        ? 1 / 60
        : Math.min(Math.max((time - lastTime) / 1000, 0), MAX_DELTA_SECONDS);
      lastTime = time;

      const pointerFollow = 1 - Math.exp(-POINTER_FOLLOW_RATE * deltaSeconds);
      pointer.x += (pointer.targetX - pointer.x) * pointerFollow;
      pointer.y += (pointer.targetY - pointer.y) * pointerFollow;
      activity.energy *= Math.exp(-ACTIVITY_DECAY_RATE * deltaSeconds);

      const dark = document.documentElement.classList.contains("dark");
      context.clearRect(0, 0, width, height);

      const base = context.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, dark ? "rgba(10,10,10,.96)" : "rgba(244,239,232,.9)");
      base.addColorStop(1, dark ? "rgba(10,10,10,.78)" : "rgba(244,239,232,.72)");
      context.fillStyle = base;
      context.fillRect(0, 0, width, height);

      const glow = (x: number, y: number, color: string) => {
        const gradient = context.createRadialGradient(x, y, 0, x, y, Math.max(width, height) * 0.46);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "transparent");
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
      };

      glow(width * (0.16 + pointer.x * 0.04), height * 0.12, dark ? "rgba(255,133,83,.12)" : "rgba(255,151,105,.18)");
      glow(width * (0.84 - pointer.x * 0.04), height * 0.72, dark ? "rgba(88,78,235,.14)" : "rgba(117,105,224,.14)");

      if (activity.energy > 0.01) {
        const ripple = context.createRadialGradient(
          activity.x * width,
          activity.y * height,
          0,
          activity.x * width,
          activity.y * height,
          180 * activity.energy,
        );
        ripple.addColorStop(0, dark ? `rgba(255,166,108,${0.14 * activity.energy})` : `rgba(116,91,70,${0.12 * activity.energy})`);
        ripple.addColorStop(1, "transparent");
        context.fillStyle = ripple;
        context.fillRect(0, 0, width, height);
      }

      const pointerX = pointer.x * width;
      const pointerY = pointer.y * height;
      const elapsedSeconds = time / 1000;

      for (const particle of particles) {
        const dx = particle.x - pointerX;
        const dy = particle.y - pointerY;
        const distance = Math.max(40, Math.hypot(dx, dy));
        const influence = reducedMotion ? 0 : Math.max(0, 1 - distance / 260);
        const pushX = (dx / distance) * influence * 8;
        const pushY = (dy / distance) * influence * 8;
        const waveX = reducedMotion ? 0 : Math.sin(elapsedSeconds * IDLE_WAVE_RATE + particle.phase) * 3;
        const waveY = reducedMotion ? 0 : Math.cos(elapsedSeconds * IDLE_WAVE_RATE * 0.9 + particle.phase) * 2.4;

        const drift = reducedMotion ? 0 : 1;
        particle.x += (particle.vx * drift + pushX + waveX) * deltaSeconds;
        particle.y += (particle.vy * drift + pushY + waveY) * deltaSeconds;

        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        if (particle.y > height + 20) particle.y = -20;
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance >= 150) continue;
          const nearPointer = Math.max(0, 1 - Math.hypot((a.x + b.x) / 2 - pointerX, (a.y + b.y) / 2 - pointerY) / 260);
          context.strokeStyle = dark
            ? `rgba(120,115,220,${0.08 + nearPointer * 0.12})`
            : `rgba(76,69,130,${0.08 + nearPointer * 0.1})`;
          context.lineWidth = 0.6;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }

      for (const particle of particles) {
        context.fillStyle = dark ? "rgba(151,145,255,.42)" : "rgba(67,61,113,.42)";
        context.beginPath();
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        context.fill();
      }

      scheduleFrame();
    };

    const observer = new ResizeObserver(resize);
    const themeObserver = new MutationObserver(() => {
      if (reducedMotion && !paused && mounted) draw(performance.now());
    });
    observer.observe(canvas);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    resize();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("keydown", onActivity);
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotionChange);
    if (!reducedMotion) scheduleFrame();

    return () => {
      mounted = false;
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onActivity);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div aria-hidden className="dashboard-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <canvas ref={canvasRef} data-testid="pairing-interactive-background" className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
