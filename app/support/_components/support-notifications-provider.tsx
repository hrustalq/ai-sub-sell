"use client";

import { useEffect, useRef } from "react";
import { pageTitle } from "@/lib/brand";
import { useUnreadSummary } from "@/lib/orders/hooks";

export function SupportNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { totalUnread } = useUnreadSummary({ viewer: "seller" });
  const prevTotalRef = useRef(totalUnread);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const base = pageTitle("Поддержка");
    document.title = totalUnread > 0 ? `(${totalUnread}) ${base}` : base;
  }, [totalUnread]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    void Notification.requestPermission();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || Notification.permission !== "granted") return;
    if (document.visibilityState === "visible") {
      prevTotalRef.current = totalUnread;
      return;
    }

    const delta = totalUnread - prevTotalRef.current;
    if (delta > 0) {
      try {
        new Notification("Новые сообщения в заказах", {
          body:
            delta === 1
              ? "1 непрочитанное сообщение от покупателя"
              : `${delta} непрочитанных сообщений от покупателей`,
          tag: "support-unread-summary",
        });
      } catch {
        // ignore
      }
    }

    prevTotalRef.current = totalUnread;
  }, [totalUnread]);

  return children;
}
