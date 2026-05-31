import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...[
        "lh3.googleusercontent.com",
        "lh4.googleusercontent.com",
        "lh5.googleusercontent.com",
        "lh6.googleusercontent.com",
      ].map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
    ],
  },
};

export default nextConfig;
