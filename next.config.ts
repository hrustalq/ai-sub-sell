import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'pino-pretty', 'pino'],
};

export default nextConfig;
