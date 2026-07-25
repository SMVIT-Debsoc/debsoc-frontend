const productionSiteUrl = "https://www.smvitdebsoc.com";
const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
  process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, "");

export const SITE_URL =
  process.env.NODE_ENV === "production"
    ? productionSiteUrl
    : configuredSiteUrl || productionSiteUrl;

export const SITE_NAME = "SMVIT DebSoc";
export const SITE_DESCRIPTION =
  "SMVIT DebSoc is the official debate society of SMVIT, focused on public speaking, parliamentary debating, and critical thinking.";
