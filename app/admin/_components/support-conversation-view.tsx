"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MessageSquareIcon } from "lucide-react";
import type {
  SupportConversationDetailRecord,
  SupportConversationMessageRecord,
} from "@/lib/support/types";
import { routes } from "@/lib/routes";
import { SupportConversationChat } from "@/components/support/conversation-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

type SupportConversationViewProps = {
  conversation: SupportConversationDetailRecord;
  initialMessages: SupportConversationMessageRecord[];
  initialUnreadCount: number;
};

export function SupportConversationView({
  conversation,
  initialMessages,
  initialUnreadCount,
}: SupportConversationViewProps) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClose() {
    setClosing(true);
    setError(null);
    try {
      const res = await fetch(`/api/support/conversations/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Не удалось закрыть обращение");
      }
      router.push(routes.admin.supportChats);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка закрытия");
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-2 lg:items-stretch">
      <Card className="flex min-h-0 flex-col">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <MessageSquareIcon className="size-5" />
            {conversation.buyerLabel}
            <Badge variant="outline">Без заказа</Badge>
          </CardTitle>
          <CardDescription>
            № {conversation.id} ·{" "}
            {format(new Date(conversation.createdAt), "d MMMM yyyy, HH:mm", { locale: ru })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {conversation.buyerEmail && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span>{conversation.buyerEmail}</span>
            </div>
          )}
          {conversation.buyerTelegramUserId && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Telegram ID</span>
              <span className="font-mono">{conversation.buyerTelegramUserId}</span>
            </div>
          )}
          <p className="text-muted-foreground">
            Это общее обращение, не связанное с конкретным заказом. Для вопросов по оплате
            или доступу используйте чат внутри заказа.
          </p>
          <Button variant="outline" disabled={closing} onClick={handleClose}>
            {closing && <Spinner />}
            Закрыть обращение
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <SupportConversationChat
        conversationId={conversation.id}
        initialMessages={initialMessages}
        initialUnreadCount={initialUnreadCount}
        className="min-h-0 lg:h-full lg:max-h-full"
      />
    </div>
  );
}
