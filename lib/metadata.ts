import { Metadata } from 'next';

export function generatePageMetadata({
  title,
  description,
  path,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  keywords: string[];
}): Metadata {
  return {
    title: `${title} | SMVIT DEBSOC`,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: `https://debsoc.in${path}`,
      siteName: 'SMVIT DEBSOC',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
