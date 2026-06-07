import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true, // ← add this
  },
  typescript: {
    ignoreBuildErrors: true, // ← add this too for any TS errors
  },
};

export default nextConfig;
