"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MessageSquareIcon } from "lucide-react";
import { useSupportConversationMessages } from "@/lib/support/hooks";
import type { SupportConversationMessageRecord } from "@/lib/support/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SupportConversationChatProps = {
  conversationId: string;
  initialMessages?: SupportConversationMessageRecord[];
  initialUnreadCount?: number;
  className?: string;
};

export function SupportConversationChat({
  conversationId,
  initialMessages,
  initialUnreadCount,
  className,
}: SupportConversationChatProps) {
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, unreadCount, sendMessage, isLoading } = useSupportConversationMessages(
    conversationId,
    {
      fallbackMessages: initialMessages,
      fallbackUnreadCount: initialUnreadCount,
    },
  );

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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending && chatInput.trim()) {
        void handleSendMessage();
      }
    }
  }

  return (
    <Card className={cn("flex min-h-0 flex-col overflow-visible lg:h-full lg:max-h-full", className)}>
      <CardHeader className="shrink-0 space-y-1 pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2">
          <MessageSquareIcon className="size-5 shrink-0" />
          Обращение
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Общий чат без привязки к заказу. Ответ покупателю придёт в Telegram.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="relative flex min-h-0 flex-1 flex-col rounded-lg border bg-background min-h-48">
          <ScrollArea className="min-h-0 flex-1 rounded-[inherit] p-3">
            {isLoading && messages.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Сообщений пока нет.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {messages.map((message) => {
                  const isOwn = message.author === "seller";
                  return (
                    <li
                      key={message.id}
                      className={cn(
                        "flex max-w-[min(85%,24rem)] flex-col gap-1 rounded-lg px-3 py-2 text-sm",
                        isOwn ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      <span className="text-xs opacity-80">
                        {isOwn ? "Вы" : "Покупатель"} ·{" "}
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
        {sendError && <p className="shrink-0 text-sm text-destructive">{sendError}</p>}

        <form
          className="flex shrink-0 flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendMessage();
          }}
        >
          <Textarea
            ref={textareaRef}
            rows={3}
            placeholder="Ответ покупателю…"
            value={chatInput}
            disabled={sending}
            className="min-h-14 resize-none"
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleComposerKeyDown}
          />
          <Button type="submit" disabled={sending || !chatInput.trim()} className="self-end">
            {sending && <Spinner />}
            Отправить
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
