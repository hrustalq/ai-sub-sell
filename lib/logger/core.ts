import pino, { type Logger, type LoggerOptions, type StreamEntry } from "pino";

import {
  datadogHttpLogsEnabled,
  getDatadogLogBase,
} from "../datadog/config";
import { createDatadogLogStream } from "../datadog/logs";

const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "*.password",
  "*.secret",
  "*.token",
  "*.accessToken",
  "*.accessTokenHash",
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "YOOKASSA_SECRET_KEY",
  "SMTP_PASS",
  "TELEGRAM_SELL_BOT_TOKEN",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_SECRET",
  "CRON_SECRET",
  "DD_API_KEY",
  "*.ctx.api.token",
  "err.ctx.api.token",
];

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function shouldUsePretty(): boolean {
  if (process.env.LOG_PRETTY === "true") return true;
  if (process.env.LOG_PRETTY === "false") return false;
  return !isProduction();
}

export function getLogLevel(): string {
  return (
    process.env.LOG_LEVEL?.trim() ||
    process.env.PINO_LOG_LEVEL?.trim() ||
    (isProduction() ? "info" : "debug")
  );
}

export function prismaQueryLoggingEnabled(): boolean {
  return process.env.LOG_PRISMA_QUERIES === "true";
}

function buildLoggerOptions(): LoggerOptions {
  return {
    level: getLogLevel(),
    redact: {
      paths: REDACT_PATHS,
      censor: "[Redacted]",
    },
    base: {
      pid: process.pid,
      ...getDatadogLogBase(),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };
}

function buildProductionStreams(): StreamEntry[] {
  const streams: StreamEntry[] = [{ stream: process.stdout }];
  if (datadogHttpLogsEnabled()) {
    streams.push({ stream: createDatadogLogStream() });
  }
  return streams;
}

let rootLogger: Logger | undefined;

export function getRootLogger(): Logger {
  if (!rootLogger) {
    const options = buildLoggerOptions();
    if (shouldUsePretty()) {
      rootLogger = pino({
        ...options,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      });
    } else if (datadogHttpLogsEnabled()) {
      rootLogger = pino(options, pino.multistream(buildProductionStreams()));
    } else {
      rootLogger = pino(options);
    }
  }
  return rootLogger;
}

/** Named child logger — use `module` in journal queries, e.g. `journalctl ... | grep '"module":"webhook"'`. */
export function createLogger(module: string): Logger {
  return getRootLogger().child({ module });
}

export function logError(
  log: Logger,
  message: string,
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  log.error({ err, ...extra }, message);
}
