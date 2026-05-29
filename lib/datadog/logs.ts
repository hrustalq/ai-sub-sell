import { Writable } from "node:stream";

import { getDatadogSite } from "./config";

const INTAKE_PATH = "/api/v2/logs";

function intakeUrl(): string {
  return `https://http-intake.logs.${getDatadogSite()}${INTAKE_PATH}`;
}

async function postLog(body: string): Promise<void> {
  const apiKey = process.env.DD_API_KEY?.trim();
  if (!apiKey) return;

  const response = await fetch(intakeUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "DD-API-KEY": apiKey,
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Datadog log intake ${response.status}: ${detail.slice(0, 200)}`,
    );
  }
}

/** Fire-and-forget JSON log line to Datadog HTTP intake. */
export function sendLogLine(line: string): void {
  void postLog(line).catch((err) => {
    process.stderr.write(
      `[datadog] failed to ship log: ${err instanceof Error ? err.message : String(err)}\n`,
    );
  });
}

/** Writable stream for pino multistream (avoids worker-thread transports in Next.js). */
export function createDatadogLogStream(): Writable {
  return new Writable({
    write(chunk, _encoding, callback) {
      sendLogLine(chunk.toString());
      callback();
    },
  });
}
