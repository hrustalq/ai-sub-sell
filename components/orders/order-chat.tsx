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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      textareaRef.current?.focus();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setSending(false);
    }
  }

  function handleComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (chatInput) {
        setChatInput("");
        setSendError(null);
      } else {
        e.currentTarget.blur();
      }
      return;
    }

    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!sending && chatInput.trim()) {
        void handleSendMessage();
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending && chatInput.trim()) {
        void handleSendMessage();
      }
    }
  }

  function messageLabel(author: string): string {
    if (authorRole === "seller") {
      return author === "seller" ? "Вы" : "Покупатель";
    }
    return author === "seller" ? "Продавец" : "Вы";
  }

  return (
    <Card
      className={cn(
        "flex min-h-0 flex-col overflow-visible",
        "min-h-[min(22rem,52dvh)] sm:min-h-[min(26rem,58dvh)]",
        "lg:h-full lg:max-h-full lg:min-h-0",
        className,
      )}
    >
      <CardHeader className={cn("shrink-0 space-y-1", compact ? "pb-2 pt-4" : "pb-3")}>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <MessageSquareIcon className="size-5 shrink-0" />
          Чат с продавцом
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {authorRole === "seller"
            ? "Ответ покупателю"
            : "Задайте вопрос по заказу — ответим в этом чате"}
          <span className="mt-1 hidden text-xs text-muted-foreground/80 sm:block">
            Enter — отправить · Shift+Enter — новая строка · Esc — очистить
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3">
        <div
          className={cn(
            "relative flex min-h-0 flex-1 flex-col rounded-lg border bg-background",
            "min-h-40 sm:min-h-48",
          )}
        >
          <ScrollArea
            className={cn(
              "min-h-0 flex-1 rounded-[inherit]",
              compact ? "p-2" : "p-2 sm:p-3",
            )}
          >
            {isLoading && messages.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Сообщений пока нет.</p>
            ) : (
              <ul className="flex flex-col gap-2 sm:gap-3">
                {messages.map((message) => {
                  const isOwn =
                    (authorRole === "seller" && message.author === "seller") ||
                    (authorRole === "buyer" && message.author === "buyer");

                  return (
                    <li
                      key={message.id}
                      className={cn(
                        "flex max-w-[min(90%,20rem)] flex-col gap-1 rounded-lg px-2.5 py-2 text-sm sm:max-w-[min(85%,24rem)] sm:px-3",
                        isOwn
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      <span className="text-xs opacity-80">
                        {messageLabel(message.author)} ·{" "}
                        {format(new Date(message.createdAt), "HH:mm", { locale: ru })}
                      </span>
                      <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>
                    </li>
                  );
                })}
                <div ref={bottomRef} />
              </ul>
            )}
          </ScrollArea>
        </div>

        <Separator className="shrink-0" />

        {sendError && (
          <p className="shrink-0 text-sm text-destructive">{sendError}</p>
        )}

        <form
          className="flex shrink-0 flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendMessage();
          }}
        >
          <Textarea
            ref={textareaRef}
            rows={compact ? 2 : 3}
            placeholder="Ваше сообщение…"
            value={chatInput}
            disabled={sending}
            aria-keyshortcuts="Enter Control+Enter Meta+Enter"
            className="min-h-11 resize-none sm:min-h-14"
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleComposerKeyDown}
          />
          <Button
            type="submit"
            disabled={sending || !chatInput.trim()}
            className="w-full sm:w-auto sm:self-end"
          >
            {sending && <Spinner />}
            Отправить
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
