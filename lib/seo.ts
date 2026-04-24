import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type PublicPageInput = {
  title: string;
  description: string;
  path: string;
};

export function buildPublicPageMetadata({
  title,
  description,
  path,
}: PublicPageInput): Metadata {
  const canonicalUrl = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      title: `${title} | ${SITE_NAME}`,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: "/quote-image.jpg",
          width: 1200,
          height: 630,
          alt: `${title} | ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: ["/quote-image.jpg"],
    },
  };
}

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
