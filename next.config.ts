import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typedRoutes: true,
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
