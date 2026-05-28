import type { NextConfig } from "next";
import { routes } from "./lib/routes";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'pino-pretty', 'pino'],
  async redirects() {
    return [
      {
        source: "/support",
        destination: routes.admin.support,
        permanent: true,
      },
      {
        source: "/support/:orderId",
        destination: `${routes.admin.support}/:orderId`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
