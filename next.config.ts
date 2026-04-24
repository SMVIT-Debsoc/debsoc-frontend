import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/debateTimer",
        destination: "/debate-timer",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
