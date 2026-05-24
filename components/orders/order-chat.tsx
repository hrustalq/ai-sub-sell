"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MessageSquareIcon } from "lucide-react";
import { useOrderMessages } from "@/lib/orders/hooks";
import { useMessageNotifications } from "@/lib/orders/use-message-notifications";
import type { OrderMessageRecord } from "@/lib/orders/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type OrderChatProps = {
  orderId: string;
  accessToken: string | null;
  authorRole: "buyer" | "seller";
  initialMessages?: OrderMessageRecord[];
  initialUnreadCount?: number;
  orderLabel?: string;
  enableNotifications?: boolean;
  className?: string;
  compact?: boolean;
};

export function OrderChat({
  orderId,
  accessToken,
  authorRole,
  initialMessages,
  initialUnreadCount,
  orderLabel,
  enableNotifications = true,
  className,
  compact = false,
}: OrderChatProps) {
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, unreadCount, sendMessage, isLoading } = useOrderMessages(
    orderId,
    accessToken,
    {
      fallbackMessages: initialMessages,
      fallbackUnreadCount: initialUnreadCount,
    },
  );

  useMessageNotifications(messages, authorRole, {
    enabled: enableNotifications,
    orderLabel,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSendMessage() {
    const body = chatInput.trim();
    if (!body) return;

    setSending(true);
    setSendError(null);
    try {
      await sendMessage(body);
      setChatInput("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setSending(false);
    }
  }

  function messageLabel(author: string): string {
    if (authorRole === "seller") {
      return author === "seller" ? "Вы" : "Покупатель";
    }
    return author === "seller" ? "Продавец" : "Вы";
  }

  return (
    <Card className={cn("flex min-h-[360px] flex-col", className)}>
      <CardHeader className={compact ? "pb-3" : undefined}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquareIcon className="size-5" />
          Чат с продавцом
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {authorRole === "seller"
            ? "Ответ покупателю"
            : "Задайте вопрос по заказу — ответим в этом чате"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <ScrollArea className={cn("rounded-lg border p-3", compact ? "h-48" : "h-64")}>
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Сообщений пока нет.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {messages.map((message) => {
                const isOwn =
                  (authorRole === "seller" && message.author === "seller") ||
                  (authorRole === "buyer" && message.author === "buyer");

                return (
                  <li
                    key={message.id}
                    className={cn(
                      "flex max-w-[90%] flex-col gap-1 rounded-lg px-3 py-2 text-sm",
                      isOwn ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    <span className="text-xs opacity-80">
                      {messageLabel(message.author)} ·{" "}
                      {format(new Date(message.createdAt), "HH:mm", { locale: ru })}
                    </span>
                    <p className="whitespace-pre-wrap">{message.body}</p>
                  </li>
                );
              })}
              <div ref={bottomRef} />
            </ul>
          )}
        </ScrollArea>

        <Separator />

        {sendError && <p className="text-sm text-destructive">{sendError}</p>}

        <div className="flex flex-col gap-2">
          <Textarea
            rows={compact ? 2 : 3}
            placeholder="Ваше сообщение…"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={sending || !chatInput.trim()}
            className="self-end"
          >
            {sending && <Spinner />}
            Отправить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
