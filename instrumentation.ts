export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // dd-trace is loaded earlier via NODE_OPTIONS=--require datadog-preload.cjs
    const { runTelegramStartup } = await import("@/lib/telegram/webhooks");
    void runTelegramStartup();
  }
}
