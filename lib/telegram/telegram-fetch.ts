/** Shared fetch for api.telegram.org (CLI scripts + grammY bots). */

const TELEGRAM_FETCH_TIMEOUT_MS = 30_000;
const TELEGRAM_FETCH_RETRIES = 3;
const RETRY_DELAY_MS = 1_500;

export async function telegramFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < TELEGRAM_FETCH_RETRIES; attempt++) {
    try {
      return await fetch(input, {
        ...init,
        signal: init?.signal ?? AbortSignal.timeout(TELEGRAM_FETCH_TIMEOUT_MS),
      });
    } catch (err) {
      lastError = err;
      if (attempt < TELEGRAM_FETCH_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

/** Pass to `new Bot(token, telegramBotClientConfig)`. */
export const telegramBotClientConfig = {
  client: { fetch: telegramFetch },
} as const;
