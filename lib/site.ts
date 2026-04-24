export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
  process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, "") ||
  "https://www.smvitdebsoc.com";

export const SITE_NAME = "SMVIT DebSoc";
export const SITE_DESCRIPTION =
  "SMVIT DebSoc is the official debate society of SMVIT, focused on public speaking, parliamentary debating, and critical thinking.";
