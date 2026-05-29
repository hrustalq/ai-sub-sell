import type { NextConfig } from "next";
import { routes } from "./lib/routes";

const datadogNativeExternals = [
  "@datadog/native-metrics",
  "@datadog/pprof",
  "@datadog/native-appsec",
  "@datadog/native-iast-taint-tracking",
  "@datadog/native-iast-rewriter",
];

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "better-sqlite3",
    "pino-pretty",
    "pino",
    "dd-trace",
    ...datadogNativeExternals,
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals ?? [];
      if (Array.isArray(config.externals)) {
        config.externals.push(...datadogNativeExternals);
      }
    }
    return config;
  },
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
