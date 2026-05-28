import pino, { type Logger, type LoggerOptions } from "pino";

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
  "TELEGRAM_SUPPORT_BOT_TOKEN",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_SECRET",
  "CRON_SECRET",
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
      env: process.env.NODE_ENV ?? "development",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };
}

let rootLogger: Logger | undefined;

export function getRootLogger(): Logger {
  if (!rootLogger) {
    const options = buildLoggerOptions();
    rootLogger = shouldUsePretty()
      ? pino({
          ...options,
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          },
        })
      : pino(options);
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
