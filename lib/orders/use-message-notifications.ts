"use client";

import { useEffect, useRef } from "react";
import type { OrderMessageRecord } from "@/lib/orders/types";

type UseMessageNotificationsOptions = {
  enabled?: boolean;
  orderLabel?: string;
};

export function useMessageNotifications(
  messages: OrderMessageRecord[],
  authorRole: "buyer" | "seller",
  options?: UseMessageNotificationsOptions,
) {
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const permissionRequestedRef = useRef(false);

  useEffect(() => {
    if (!options?.enabled || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (permissionRequestedRef.current) return;
    permissionRequestedRef.current = true;

    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, [options?.enabled]);

  useEffect(() => {
    if (!options?.enabled) return;

    const currentIds = new Set(messages.map((message) => message.id));

    if (!initializedRef.current) {
      initializedRef.current = true;
      seenIdsRef.current = currentIds;
      return;
    }

    if (typeof window === "undefined" || Notification.permission !== "granted") {
      seenIdsRef.current = currentIds;
      return;
    }

    if (document.visibilityState === "visible") {
      seenIdsRef.current = currentIds;
      return;
    }

    for (const message of messages) {
      if (seenIdsRef.current.has(message.id)) continue;

      const isIncoming =
        (authorRole === "buyer" && message.author === "seller") ||
        (authorRole === "seller" && message.author === "buyer");

      if (!isIncoming) continue;

      const title =
        authorRole === "buyer"
          ? "Новое сообщение от продавца"
          : "Новое сообщение от покупателя";

      const body = options.orderLabel
        ? `${options.orderLabel}: ${message.body}`
        : message.body;

      try {
        new Notification(title, {
          body: body.length > 120 ? `${body.slice(0, 119)}…` : body,
          tag: `order-message-${message.id}`,
        });
      } catch {
        // ignore — e.g. unsupported environment
      }
    }

    seenIdsRef.current = currentIds;
  }, [messages, authorRole, options?.enabled, options?.orderLabel]);
}
