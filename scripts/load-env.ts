import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

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
