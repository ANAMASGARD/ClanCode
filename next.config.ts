import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  agentRules: false,
  experimental: {
    // Next 16's CLI subprocess currently returns empty --showConfig output in
    // this Bun/Node environment. The compiler API preserves the same checks.
    useTypeScriptCli: false,
    webpackBuildWorker: false,
  },
};

export default nextConfig;
