import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Force Vercel to ignore type errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
