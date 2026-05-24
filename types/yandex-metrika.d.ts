declare global {
  interface Window {
    dataLayer?: unknown[];
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
  }
}

export {};
