export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runTelegramStartup } = await import("@/lib/telegram/webhooks");
    void runTelegramStartup();
  }
}
