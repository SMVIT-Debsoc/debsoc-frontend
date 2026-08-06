"use client";

import { OverlayScrollbar, type OverlayScrollbarProps } from "@ehfuse/overlay-scrollbar";

const thumb = {
  width: 6,
  minHeight: 44,
  radius: 999,
  color: "var(--scrollbar-thumb)",
  opacity: 0.62,
  hoverColor: "var(--scrollbar-thumb-hover)",
  hoverOpacity: 0.9,
};

const track = {
  width: 12,
  color: "transparent",
  visible: false,
  alignment: "default" as const,
  radius: 999,
  margin: 4,
  overflowX: false,
  overflowY: true,
};

const autoHide = {
  enabled: true,
  delay: 1400,
  delayOnWheel: 650,
  initialDelay: 240,
};

const dragScroll = {
  enabled: false,
};

export default function DebsocOverlayScrollbar({ className = "", ...props }: OverlayScrollbarProps) {
  return (
    <OverlayScrollbar
      {...props}
      className={`debsoc-overlay-scrollbar min-w-0 ${className}`.trim()}
      thumb={props.thumb ?? thumb}
      track={props.track ?? track}
      autoHide={props.autoHide ?? autoHide}
      dragScroll={props.dragScroll ?? dragScroll}
      showScrollbar={props.showScrollbar ?? true}
      showHorizontalScrollbar={props.showHorizontalScrollbar ?? false}
    />
  );
}
