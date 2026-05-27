import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse and xlsx use Node.js built-ins — keep them server-side only
  serverExternalPackages: ["pdf-parse", "xlsx"],
};

export default nextConfig;
