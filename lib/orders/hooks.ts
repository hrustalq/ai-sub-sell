"use client";

import useSWR from "swr";
import { jsonFetcher } from "@/lib/orders/fetcher";
import { orderApiUrl } from "@/lib/orders/api-url";
import type {
  OrderDetailResponse,
  OrderMessageRecord,
  OrderMessagesResponse,
  OrderUnreadSummaryResponse,
} from "@/lib/orders/types";

const POLL_INTERVAL_MS = 5000;

export function useOrder(
  orderId: string,
  accessToken: string | null,
  options?: { fallback?: OrderDetailResponse },
) {
  const url = orderApiUrl(orderId, "", accessToken);

  const { data, error, isLoading, mutate } = useSWR<OrderDetailResponse>(
    url,
    jsonFetcher,
    {
      fallbackData: options?.fallback,
      refreshInterval: POLL_INTERVAL_MS,
      revalidateOnFocus: true,
    },
  );

  return {
    order: data?.order,
    access: data?.access,
    error,
    isLoading,
    mutate,
  };
}

export function useOrderMessages(
  orderId: string,
  accessToken: string | null,
  options?: {
    fallbackMessages?: OrderMessageRecord[];
    fallbackUnreadCount?: number;
    markRead?: boolean;
  },
) {
  const url = orderApiUrl(orderId, "/messages", accessToken);
  const readUrl = orderApiUrl(orderId, "/messages/read", accessToken);

  const { data, error, isLoading, mutate } = useSWR<OrderMessagesResponse>(
    url,
    jsonFetcher,
    {
      fallbackData:
        options?.fallbackMessages !== undefined
          ? {
              messages: options.fallbackMessages,
              unreadCount: options.fallbackUnreadCount ?? 0,
            }
          : undefined,
      refreshInterval: POLL_INTERVAL_MS,
      revalidateOnFocus: true,
      onSuccess: (response) => {
        if (options?.markRead !== false && response.unreadCount > 0) {
          void markRead();
        }
      },
    },
  );

  async function markRead() {
    const res = await fetch(readUrl, { method: "POST" });
    if (!res.ok) return;
    const payload = (await res.json()) as { unreadCount: number };
    await mutate(
      (current) =>
        current
          ? { ...current, unreadCount: payload.unreadCount }
          : current,
      { revalidate: false },
    );
  }

  async function sendMessage(body: string) {
    const trimmed = body.trim();
    if (!trimmed) return;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(
        typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "Не удалось отправить сообщение",
      );
    }

    const payload = (await res.json()) as {
      message: OrderMessageRecord;
      unreadCount: number;
    };

    await mutate(
      (current) => ({
        messages: [...(current?.messages ?? []), payload.message],
        unreadCount: payload.unreadCount,
      }),
      { revalidate: false },
    );

    return payload.message;
  }

  return {
    messages: data?.messages ?? [],
    unreadCount: data?.unreadCount ?? 0,
    error,
    isLoading,
    mutate,
    markRead,
    sendMessage,
  };
}

export function useUnreadSummary(options?: {
  viewer?: "buyer" | "seller";
  enabled?: boolean;
}) {
  const enabled = options?.enabled ?? true;
  const key = !enabled
    ? null
    : options?.viewer === "seller"
      ? "/api/orders/unread-summary?viewer=seller"
      : "/api/orders/unread-summary";

  const { data, error, isLoading, mutate } = useSWR<OrderUnreadSummaryResponse>(
    key,
    jsonFetcher,
    {
      refreshInterval: POLL_INTERVAL_MS,
      revalidateOnFocus: true,
    },
  );

  const unreadByOrderId = new Map(
    (data?.orders ?? []).map((entry) => [entry.orderId, entry.unreadCount]),
  );

  return {
    totalUnread: data?.totalUnread ?? 0,
    unreadByOrderId,
    error,
    isLoading,
    mutate,
  };
}
