"use strict";

/**
 * Loaded via NODE_OPTIONS=--require ./datadog-preload.cjs before Next.js starts.
 * dd-trace must initialize before other modules for APM and Pino log injection.
 */
function shouldEnableTracing() {
  if (process.env.DD_TRACE_ENABLED === "false") return false;
  if (process.env.DD_TRACE_ENABLED === "true") return true;
  return process.env.NODE_ENV === "production";
}

if (!shouldEnableTracing()) {
  return;
}

if (!process.env.DD_SERVICE) {
  process.env.DD_SERVICE = "ai-sub-sell";
}

if (!process.env.DD_LOGS_INJECTION) {
  process.env.DD_LOGS_INJECTION = "true";
}

if (!process.env.DD_VERSION) {
  try {
    const { readFileSync } = require("node:fs");
    const { join } = require("node:path");
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "package.json"), "utf8"),
    );
    if (pkg.version) process.env.DD_VERSION = pkg.version;
  } catch {
    // ignore
  }
}

require("dd-trace/init");
