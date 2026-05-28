"use client";

import useSWR from "swr";
import { jsonFetcher } from "@/lib/orders/fetcher";
import type { SupportConversationMessageRecord } from "@/lib/support/types";

const POLL_INTERVAL_MS = 5000;

type SupportConversationMessagesResponse = {
  messages: SupportConversationMessageRecord[];
  unreadCount: number;
};

function conversationMessagesUrl(conversationId: string): string {
  return `/api/support/conversations/${conversationId}/messages`;
}

function conversationReadUrl(conversationId: string): string {
  return `/api/support/conversations/${conversationId}/messages/read`;
}

export function useSupportConversationMessages(
  conversationId: string,
  options?: {
    fallbackMessages?: SupportConversationMessageRecord[];
    fallbackUnreadCount?: number;
    markRead?: boolean;
  },
) {
  const url = conversationMessagesUrl(conversationId);
  const readUrl = conversationReadUrl(conversationId);

  const { data, error, isLoading, mutate } = useSWR<SupportConversationMessagesResponse>(
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
        current ? { ...current, unreadCount: payload.unreadCount } : current,
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
        typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
          ? payload.error
          : "Не удалось отправить сообщение",
      );
    }

    const payload = (await res.json()) as {
      message: SupportConversationMessageRecord;
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
