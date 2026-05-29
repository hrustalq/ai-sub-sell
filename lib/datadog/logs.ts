import { hostname } from "node:os";
import { Writable } from "node:stream";

import {
  getDatadogEnv,
  getDatadogService,
  getDatadogSite,
} from "./config";

const INTAKE_PATH = "/api/v2/logs";

const PINO_STATUS: Record<number, string> = {
  10: "debug",
  20: "debug",
  30: "info",
  40: "warn",
  50: "error",
  60: "error",
};

function intakeUrl(): string {
  return `https://http-intake.logs.${getDatadogSite()}${INTAKE_PATH}`;
}

function pinoLevelToStatus(level: unknown): string {
  if (typeof level === "number") {
    return PINO_STATUS[level] ?? "info";
  }
  return "info";
}

/** Map a Pino JSON line to Datadog HTTP intake v2 format. */
export function pinoLineToDatadogEntry(
  line: string,
): Record<string, unknown> {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(line) as Record<string, unknown>;
  } catch {
    return {
      message: line.trim(),
      service: getDatadogService(),
      ddsource: "nodejs",
      ddtags: `env:${getDatadogEnv() ?? "unknown"}`,
      status: "info",
      hostname: hostname(),
    };
  }

  const { msg, level, time, pid: _pid, hostname: _host, ...rest } = parsed;
  const message =
    typeof msg === "string" ? msg : typeof rest.message === "string" ? rest.message : line.trim();

  return {
    ...rest,
    message,
    service:
      (typeof parsed.service === "string" && parsed.service) ||
      getDatadogService(),
    ddsource: "nodejs",
    ddtags: `env:${typeof parsed.env === "string" ? parsed.env : getDatadogEnv() ?? "unknown"}`,
    status: pinoLevelToStatus(level),
    hostname: typeof parsed.hostname === "string" ? parsed.hostname : hostname(),
    ...(typeof time === "string" ? { timestamp: time } : {}),
  };
}

async function postEntries(entries: Record<string, unknown>[]): Promise<void> {
  const apiKey = process.env.DD_API_KEY?.trim();
  if (!apiKey || entries.length === 0) return;

  const response = await fetch(intakeUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "DD-API-KEY": apiKey,
    },
    body: JSON.stringify(entries),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Datadog log intake ${response.status}: ${detail.slice(0, 300)}`,
    );
  }
}

const pending: Record<string, unknown>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = undefined;
    void flushPending();
  }, 3000);
}

async function flushPending(): Promise<void> {
  if (pending.length === 0) return;
  const batch = pending.splice(0, pending.length);
  await postEntries(batch);
}

/** Queue a Pino JSON line for Datadog HTTP intake (batched every 3s). */
export function sendLogLine(line: string): void {
  pending.push(pinoLineToDatadogEntry(line));
  if (pending.length >= 50) {
    void flushPending().catch(reportShipError);
    return;
  }
  scheduleFlush();
}

function reportShipError(err: unknown): void {
  process.stderr.write(
    `[datadog] failed to ship logs: ${err instanceof Error ? err.message : String(err)}\n`,
  );
}

/** Send one test log and return whether Datadog accepted it. */
export async function sendDatadogTestLog(): Promise<void> {
  await postEntries([
    {
      message: "datadog connectivity check",
      service: getDatadogService(),
      ddsource: "nodejs",
      ddtags: `env:${getDatadogEnv() ?? "unknown"}`,
      status: "info",
      hostname: hostname(),
      module: "datadog-check",
    },
  ]);
}

/** Writable stream for pino multistream (avoids worker-thread transports in Next.js). */
export function createDatadogLogStream(): Writable {
  return new Writable({
    write(chunk, _encoding, callback) {
      sendLogLine(chunk.toString());
      callback();
    },
    final(callback) {
      void flushPending()
        .then(() => callback())
        .catch((err) => {
          reportShipError(err);
          callback();
        });
    },
  });
}

process.on("beforeExit", () => {
  void flushPending().catch(reportShipError);
});
