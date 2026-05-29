/**
 * Verify Datadog config and send a test log.
 * Usage: pnpm datadog:check
 */
import "./load-env";

import {
  datadogHttpLogsEnabled,
  datadogTracingEnabled,
  getDatadogEnv,
  getDatadogService,
  getDatadogSite,
} from "../lib/datadog/config";
import { sendDatadogTestLog } from "../lib/datadog/logs";

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}

async function main(): Promise<void> {
  const apiKey = process.env.DD_API_KEY?.trim();

  console.log("Datadog configuration");
  console.log("  DD_SITE:", getDatadogSite());
  console.log("  DD_SERVICE:", getDatadogService());
  console.log("  DD_ENV:", getDatadogEnv() ?? "(unset)");
  console.log("  DD_API_KEY:", apiKey ? `${apiKey.slice(0, 8)}…` : "MISSING");
  console.log("  DD_TRACE_ENABLED:", process.env.DD_TRACE_ENABLED ?? "(auto)");
  console.log("  DD_LOGS_HTTP:", process.env.DD_LOGS_HTTP ?? "(auto in production)");
  console.log("  tracing active:", yesNo(datadogTracingEnabled()));
  console.log("  HTTP log shipping:", yesNo(datadogHttpLogsEnabled()));
  console.log(
    "  NODE_OPTIONS preload:",
    process.env.NODE_OPTIONS?.includes("datadog-preload.cjs") ? "yes" : "no — systemd/start must use datadog-preload.cjs",
  );

  if (!apiKey) {
    console.error("\nAdd DD_API_KEY to shared/.env (Datadog → Organization Settings → API Keys).");
    process.exit(1);
  }

  if (!datadogHttpLogsEnabled()) {
    console.warn(
      "\nHTTP log shipping is disabled. Set DD_LOGS_HTTP=true (dev) or run under NODE_ENV=production with DD_API_KEY.",
    );
  }

  console.log("\nSending test log to Datadog…");
  await sendDatadogTestLog();
  console.log("OK — check Datadog → Logs, filter: @module:datadog-check");
  console.log("  service:", getDatadogService());
  console.log("  env:", getDatadogEnv());
}

main().catch((err) => {
  console.error("Datadog check failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
