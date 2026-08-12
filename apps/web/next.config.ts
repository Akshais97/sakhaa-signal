import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@sakhaa-forge/db", "@sakhaa-forge/contracts"],
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  outputFileTracingIncludes: {
    "/*": [
      "../../packages/db/generated/client/libquery_engine-*.so.node",
      "../../packages/db/generated/client/schema.prisma",
    ],
  },
};

export default nextConfig;
