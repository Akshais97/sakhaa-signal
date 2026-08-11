import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sakhaa-forge/db", "@sakhaa-forge/contracts"],
};

export default nextConfig;
