/**
 * Parser for the raw plain-text debate digest.
 *
 * The digest is one plain-text string with newlines, divided into labelled
 * sections. Section headings appear on their own line and match one of the
 * known titles below (case-insensitive, tolerating surrounding markdown `**`,
 * emoji, and trailing/leading punctuation like `:` or `—`).
 *
 * Anything that looks like a heading line but doesn't match a known title still
 * starts its own generic card, and any text before the first heading becomes a
 * generic "Intro" card — so no content is ever lost.
 */

export const KNOWN_SECTIONS = [
  "TOPIC FOR TODAY",
  "PRE-KNOWLEDGE",
  "WORD BEFORE YOU READ",
  "TODAY'S ARTICLE / CASE",
  "YOUR DEBATING BUILD",
  "REBUTTAL DRILLS",
  "WEIGHING LANGUAGE TO USE",
  "VOCAB SESSION",
  "THINGS TO TAKE CARE",
] as const;

export type KnownSectionTitle = (typeof KNOWN_SECTIONS)[number];

export type DigestSection = {
  /** Canonical known title, or the raw heading text for unknown sections. */
  title: string;
  /** Section body with original line breaks preserved. */
  body: string;
  /** True when the heading matched one of KNOWN_SECTIONS. */
  known: boolean;
};

/** Normalise a line for heading comparison: strip markdown/punctuation/emoji-ish
 * decoration, collapse whitespace, uppercase. */
function normalizeHeading(line: string): string {
  return line
    .replace(/[*_#>`~]/g, "") // markdown decoration
    .replace(/^[\s\p{P}\p{S}]+|[\s\p{P}\p{S}]+$/gu, "") // leading/trailing punct+symbols
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// Precompute normalized lookups for known titles.
const KNOWN_LOOKUP = new Map<string, KnownSectionTitle>(
  KNOWN_SECTIONS.map((title) => [normalizeHeading(title), title]),
);

/**
 * Decide whether a line is a heading.
 * - If it matches a known title (normalized), return the canonical title.
 * - Otherwise, treat short, punctuation-light ALL-CAPS-ish lines as generic
 *   headings so unknown sections still get their own card.
 * Returns null for ordinary body lines.
 */
function detectHeading(rawLine: string): { title: string; known: boolean } | null {
  const trimmed = rawLine.trim();
  if (!trimmed) return null;

  const normalized = normalizeHeading(trimmed);
  if (!normalized) return null;

  const knownTitle = KNOWN_LOOKUP.get(normalized);
  if (knownTitle) return { title: knownTitle, known: true };

  // Heuristic generic heading: the visible text is entirely upper-case (letters),
  // reasonably short, and not a bullet/list line. This keeps unmatched section
  // titles as their own cards without swallowing normal sentences.
  const letters = normalized.replace(/[^A-Z]/g, "");
  const looksLikeBullet = /^[-*•\d]/.test(trimmed);
  const isShort = trimmed.length <= 60;
  const hasLetters = letters.length >= 3;
  const isUpperOnly = trimmed === trimmed.toUpperCase();

  if (isUpperOnly && isShort && hasLetters && !looksLikeBullet) {
    // Preserve the human-readable form (minus wrapping markdown/punctuation).
    const display = trimmed.replace(/^[\s*_#>`~]+|[\s*_#>`~:—-]+$/g, "").trim();
    return { title: display || normalized, known: false };
  }

  return null;
}

export function parseDigest(text: string): DigestSection[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections: DigestSection[] = [];

  let current: DigestSection | null = null;
  const preamble: string[] = [];

  for (const line of lines) {
    const heading = detectHeading(line);
    if (heading) {
      if (current) {
        current.body = current.body.replace(/\s+$/, "");
        sections.push(current);
      }
      current = { title: heading.title, body: "", known: heading.known };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    } else {
      preamble.push(line);
    }
  }

  if (current) {
    current.body = current.body.replace(/\s+$/, "");
    sections.push(current);
  }

  const intro = preamble.join("\n").trim();
  if (intro) {
    sections.unshift({ title: "Intro", body: intro, known: false });
  }

  return sections;
}
