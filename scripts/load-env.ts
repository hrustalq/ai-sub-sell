import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

/** Prefer IPv4 when VPS IPv6 to api.telegram.org is broken (common on small hosts). */
if (!process.env.NODE_OPTIONS?.includes("dns-result-order")) {
  const prior = process.env.NODE_OPTIONS?.trim();
  process.env.NODE_OPTIONS = prior
    ? `${prior} --dns-result-order=ipv4first`
    : "--dns-result-order=ipv4first";
}

const envCandidates = [
  process.env.ENV_FILE?.trim(),
  resolve(process.cwd(), "../shared/.env"),
  resolve(process.cwd(), ".env"),
].filter((path): path is string => Boolean(path));

for (const envPath of envCandidates) {
  if (!existsSync(envPath)) continue;
  loadDotenv({ path: envPath });
  break;
}
