import type { CSSProperties } from "react";

type Tone = "blue" | "lilac" | "violet";

type Node = {
  x: number;
  y: number;
  r: number;
  soft?: boolean;
};

type Constellation = {
  tone: Tone;
  delay: string;
  duration: string;
  opacity: string;
  minOpacity: string;
  driftX: string;
  driftY: string;
  nodes: Node[];
  lines: Array<[number, number, boolean?]>;
};

const CONSTELLATIONS: Constellation[] = [
  {
    tone: "violet",
    delay: "-11s",
    duration: "48s",
    opacity: "0.72",
    minOpacity: "0.52",
    driftX: "16px",
    driftY: "-10px",
    nodes: [
      { x: 5, y: 12, r: 0.24 },
      { x: 10, y: 8, r: 0.19, soft: true },
      { x: 16, y: 15, r: 0.28 },
      { x: 11, y: 22, r: 0.18, soft: true },
      { x: 20, y: 20, r: 0.22 },
    ],
    lines: [[0, 1], [1, 2], [0, 3, true], [3, 4], [2, 4, true]],
  },
  {
    tone: "blue",
    delay: "-37s",
    duration: "62s",
    opacity: "0.68",
    minOpacity: "0.48",
    driftX: "-12px",
    driftY: "14px",
    nodes: [
      { x: 78, y: 12, r: 0.2, soft: true },
      { x: 85, y: 8, r: 0.26 },
      { x: 92, y: 15, r: 0.22 },
      { x: 86, y: 22, r: 0.18, soft: true },
    ],
    lines: [[0, 1], [1, 2], [0, 3, true], [2, 3]],
  },
  {
    tone: "lilac",
    delay: "-20s",
    duration: "55s",
    opacity: "0.74",
    minOpacity: "0.5",
    driftX: "18px",
    driftY: "8px",
    nodes: [
      { x: 7, y: 74, r: 0.22 },
      { x: 14, y: 68, r: 0.18, soft: true },
      { x: 20, y: 78, r: 0.29 },
      { x: 11, y: 85, r: 0.2 },
      { x: 23, y: 88, r: 0.17, soft: true },
    ],
    lines: [[0, 1], [1, 2, true], [0, 3], [3, 4], [2, 4, true]],
  },
  {
    tone: "violet",
    delay: "-48s",
    duration: "67s",
    opacity: "0.7",
    minOpacity: "0.5",
    driftX: "-15px",
    driftY: "-12px",
    nodes: [
      { x: 77, y: 76, r: 0.2, soft: true },
      { x: 84, y: 68, r: 0.27 },
      { x: 91, y: 75, r: 0.22 },
      { x: 87, y: 84, r: 0.19, soft: true },
    ],
    lines: [[0, 1], [1, 2, true], [0, 3], [2, 3]],
  },
  {
    tone: "blue",
    delay: "-26s",
    duration: "41s",
    opacity: "0.64",
    minOpacity: "0.46",
    driftX: "10px",
    driftY: "-8px",
    nodes: [
      { x: 45, y: 82, r: 0.18, soft: true },
      { x: 51, y: 87, r: 0.25 },
      { x: 57, y: 81, r: 0.2 },
      { x: 53, y: 94, r: 0.17, soft: true },
    ],
    lines: [[0, 1], [1, 2], [1, 3, true], [2, 3]],
  },
];

export default function AmbientConstellations() {
  return (
    <div aria-hidden="true" className="ambient-constellations pointer-events-none fixed inset-0 z-0">
      <svg aria-hidden="true" className="ambient-constellations-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {CONSTELLATIONS.map((constellation, clusterIndex) => (
          <g
            className={`ambient-constellation ambient-constellation-${constellation.tone}`}
            key={`${constellation.tone}-${clusterIndex}`}
            style={
              {
                "--constellation-delay": constellation.delay,
                "--constellation-duration": constellation.duration,
                "--constellation-opacity": constellation.opacity,
                "--constellation-min-opacity": constellation.minOpacity,
                "--constellation-drift-x": constellation.driftX,
                "--constellation-drift-y": constellation.driftY,
              } as CSSProperties
            }
          >
            {constellation.lines.map(([from, to, dim], lineIndex) => (
              <line
                className={`ambient-constellation-line${dim ? " ambient-constellation-line-dim" : ""}`}
                key={`line-${lineIndex}`}
                x1={constellation.nodes[from].x}
                y1={constellation.nodes[from].y}
                x2={constellation.nodes[to].x}
                y2={constellation.nodes[to].y}
              />
            ))}
            {constellation.nodes.map((node, nodeIndex) => (
              <circle
                className={`ambient-constellation-node${node.soft ? " ambient-constellation-node-soft" : ""}`}
                cx={node.x}
                cy={node.y}
                key={`node-${nodeIndex}`}
                r={node.r}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
