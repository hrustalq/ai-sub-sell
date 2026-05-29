export function datadogTracingEnabled(): boolean {
  if (process.env.DD_TRACE_ENABLED === "false") return false;
  if (process.env.DD_TRACE_ENABLED === "true") return true;
  return process.env.NODE_ENV === "production";
}

/** Direct HTTP log intake (dev or when no agent). Do not enable with journald agent collection. */
export function datadogHttpLogsEnabled(): boolean {
  return (
    process.env.DD_LOGS_HTTP === "true" &&
    Boolean(process.env.DD_API_KEY?.trim())
  );
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
