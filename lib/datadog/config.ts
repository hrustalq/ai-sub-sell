export function datadogTracingEnabled(): boolean {
  if (process.env.DD_TRACE_ENABLED === "false") return false;
  if (process.env.DD_TRACE_ENABLED === "true") return true;
  return process.env.NODE_ENV === "production";
}

/** Direct HTTP log intake. Enabled in production when DD_API_KEY is set. Set DD_LOGS_HTTP=false with the Agent to avoid duplicates. */
export function datadogHttpLogsEnabled(): boolean {
  if (process.env.DD_LOGS_HTTP === "false") return false;
  if (!process.env.DD_API_KEY?.trim()) return false;
  if (process.env.DD_LOGS_HTTP === "true") return true;
  return process.env.NODE_ENV === "production";
}

export function getDatadogSite(): string {
  return process.env.DD_SITE?.trim() || "datadoghq.com";
}

export function getDatadogService(): string {
  return process.env.DD_SERVICE?.trim() || "ai-sub-sell";
}

export function getDatadogEnv(): string | undefined {
  const env = process.env.DD_ENV?.trim();
  if (env) return env;
  if (process.env.NODE_ENV === "production") return "production";
  if (process.env.NODE_ENV === "test") return "test";
  return "development";
}

export function getDatadogVersion(): string | undefined {
  return process.env.DD_VERSION?.trim() || undefined;
}

/** Unified service tagging fields for Pino JSON (Datadog Log Explorer). */
export function getDatadogLogBase(): Record<string, string> {
  const base: Record<string, string> = {
    service: getDatadogService(),
  };
  const env = getDatadogEnv();
  const version = getDatadogVersion();
  if (env) base.env = env;
  if (version) base.version = version;
  return base;
}
