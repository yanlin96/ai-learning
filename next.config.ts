import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let verification builds coexist with a running development server.
  distDir: process.env.CPA_TOOLS_BUILD_DIR || ".next",
};

export default nextConfig;
