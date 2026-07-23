"use client";

import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; r: number; phase: number };

export default function PairingBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;
    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let paused = document.visibilityState === "hidden";
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0.5, y: 0.45, targetX: 0.5, targetY: 0.45 };
    const activity = { x: 0.5, y: 0.45, energy: 0 };
    const particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 640 ? 22 : 48;
      particles.splice(count);
      while (particles.length < count) particles.push({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .08, r: 1 + Math.random() * 1.8, phase: Math.random() * Math.PI * 2 });
    };
    const onPointerMove = (event: PointerEvent) => { if (!reducedMotion) { pointer.targetX = event.clientX / Math.max(window.innerWidth, 1); pointer.targetY = event.clientY / Math.max(window.innerHeight, 1); } };
    const onActivity = (event: KeyboardEvent) => { if (!reducedMotion && !["Shift", "Control", "Alt", "Meta", "Tab", "Escape"].includes(event.key)) { activity.x = pointer.targetX; activity.y = pointer.targetY; activity.energy = 1; } };
    const onPointerDown = (event: PointerEvent) => { if (!reducedMotion) { activity.x = event.clientX / Math.max(window.innerWidth, 1); activity.y = event.clientY / Math.max(window.innerHeight, 1); activity.energy = 1; } };
    const onVisibility = () => { paused = document.visibilityState === "hidden"; if (!paused) frame = requestAnimationFrame(draw); };
    const observer = new ResizeObserver(resize);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => { reducedMotion = motionQuery.matches; };
    const draw = (time = 0) => {
      if (paused) return;
      pointer.x += (pointer.targetX - pointer.x) * .025;
      pointer.y += (pointer.targetY - pointer.y) * .025;
      activity.energy *= reducedMotion ? 0 : .93;
      const dark = document.documentElement.classList.contains("dark");
      context.clearRect(0, 0, width, height);
      const base = context.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, dark ? "rgba(10,10,10,.96)" : "rgba(244,239,232,.9)");
      base.addColorStop(1, dark ? "rgba(10,10,10,.78)" : "rgba(244,239,232,.72)");
      context.fillStyle = base; context.fillRect(0, 0, width, height);
      const glow = (x: number, y: number, color: string) => { const gradient = context.createRadialGradient(x, y, 0, x, y, Math.max(width, height) * .46); gradient.addColorStop(0, color); gradient.addColorStop(1, "transparent"); context.fillStyle = gradient; context.fillRect(0, 0, width, height); };
      glow(width * (.16 + pointer.x * .04), height * .12, dark ? "rgba(255,133,83,.12)" : "rgba(255,151,105,.18)");
      glow(width * (.84 - pointer.x * .04), height * .72, dark ? "rgba(88,78,235,.14)" : "rgba(117,105,224,.14)");
      if (activity.energy > .01) { const ripple = context.createRadialGradient(activity.x * width, activity.y * height, 0, activity.x * width, activity.y * height, 180 * activity.energy); ripple.addColorStop(0, dark ? `rgba(255,166,108,${.14 * activity.energy})` : `rgba(116,91,70,${.12 * activity.energy})`); ripple.addColorStop(1, "transparent"); context.fillStyle = ripple; context.fillRect(0, 0, width, height); }
      const speed = reducedMotion ? 0 : 1;
      for (const particle of particles) {
        const dx = particle.x - pointer.x * width;
        const dy = particle.y - pointer.y * height;
        const distance = Math.max(40, Math.hypot(dx, dy));
        if (!reducedMotion) { particle.vx += (-dy / distance) * .0005; particle.vy += (dx / distance) * .0005; }
        particle.x += particle.vx * speed + Math.sin(time * .0002 + particle.phase) * .04;
        particle.y += particle.vy * speed + Math.cos(time * .00018 + particle.phase) * .03;
        if (particle.x < -20) particle.x = width + 20; if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20; if (particle.y > height + 20) particle.y = -20;
      }
      for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) { const a = particles[i], b = particles[j]; const distance = Math.hypot(a.x - b.x, a.y - b.y); if (distance < 150) { const nearPointer = Math.max(0, 1 - Math.hypot((a.x + b.x) / 2 - pointer.x * width, (a.y + b.y) / 2 - pointer.y * height) / 260); context.strokeStyle = dark ? `rgba(120,115,220,${.08 + nearPointer * .12})` : `rgba(76,69,130,${.08 + nearPointer * .1})`; context.lineWidth = .6; context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke(); } }
      for (const particle of particles) { context.fillStyle = dark ? "rgba(151,145,255,.42)" : "rgba(67,61,113,.42)"; context.beginPath(); context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2); context.fill(); }
      frame = requestAnimationFrame(draw);
    };
    observer.observe(canvas); resize(); window.addEventListener("pointermove", onPointerMove, { passive: true }); window.addEventListener("pointerdown", onPointerDown, { passive: true }); window.addEventListener("keydown", onActivity); document.addEventListener("visibilitychange", onVisibility); motionQuery.addEventListener("change", onMotionChange); frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("pointermove", onPointerMove); window.removeEventListener("pointerdown", onPointerDown); window.removeEventListener("keydown", onActivity); document.removeEventListener("visibilitychange", onVisibility); motionQuery.removeEventListener("change", onMotionChange); };
  }, []);

  return <div aria-hidden className="dashboard-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden"><canvas ref={canvasRef} data-testid="pairing-interactive-background" className="pointer-events-none absolute inset-0 h-full w-full" /><span className="ambient-orb ambient-orb-warm" /><span className="ambient-orb ambient-orb-cool" /></div>;
}
