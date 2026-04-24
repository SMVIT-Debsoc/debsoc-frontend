import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const indexedRoutes = [
  "",
  "/gallery",
  "/session",
  "/debate-timer",
  "/equity",
  "/smvitpd",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return indexedRoutes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
