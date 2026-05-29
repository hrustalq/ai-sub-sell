import { MessageCircleIcon, ExternalLinkIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TelegramBuyerSupportProps = {
  botLabel: string;
  botUrl: string | null;
  orderNumberLabel: string;
};

export function TelegramBuyerSupport({
  botLabel,
  botUrl,
  orderNumberLabel,
}: TelegramBuyerSupportProps) {
  const [copied, setCopied] = useState(false);

  async function copyOrderNumber() {
    try {
      await navigator.clipboard.writeText(orderNumberLabel);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <Card className="flex min-h-0 flex-col lg:max-h-full">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageCircleIcon className="size-5" />
          Поддержка в Telegram
        </CardTitle>
        <CardDescription>
          Чат с продавцом только в боте. Номер заказа привязывает покупку к вашему Telegram.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
        <div className="rounded-lg border bg-muted/40 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Номер заказа</p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wider text-foreground">
            {orderNumberLabel}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={copyOrderNumber}
          >
            <CopyIcon className="size-4" />
            {copied ? "Скопировано" : "Скопировать номер"}
          </Button>
        </div>

        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Откройте {botLabel}
            {botUrl ? " (кнопка ниже — сразу откроется чат заказа)" : ""}.
          </li>
          <li>
            Если бот просит номер — отправьте <strong>{orderNumberLabel}</strong> одним сообщением.
          </li>
          <li>Напишите вопрос — ответ придёт в Telegram.</li>
        </ol>

        {botUrl ? (
          <Button asChild className="w-fit">
            <a href={botUrl} target="_blank" rel="noopener noreferrer">
              Открыть чат в {botLabel}
              <ExternalLinkIcon className="size-3.5" />
            </a>
          </Button>
        ) : (
          <p>Укажите TELEGRAM_BOT_USERNAME в настройках сервера, чтобы показать ссылку на бота.</p>
        )}
      </CardContent>
    </Card>
  );
}
