import { getSellBotToken } from "@/lib/telegram/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserTelegramForm } from "@/app/admin/_components/user-telegram-form";

type SupportTelegramSettingsProps = {
  telegramUserId: string | null;
  apiUrl: string;
  canEdit?: boolean;
};

export function SupportTelegramSettings({
  telegramUserId,
  apiUrl,
  canEdit = true,
}: SupportTelegramSettingsProps) {
  const botConfigured = Boolean(getSellBotToken());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram для поддержки</CardTitle>
        <CardDescription>
          Привяжите Telegram ID, чтобы получать уведомления и отвечать покупателям в том же боте, что и покупатели.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!botConfigured && (
          <p className="text-sm text-muted-foreground">
            Telegram-бот не настроен на сервере (TELEGRAM_SELL_BOT_TOKEN).
          </p>
        )}

        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Откройте @userinfobot в Telegram и скопируйте ваш числовой ID</li>
          <li>Найдите бота магазина и отправьте ему /start</li>
          <li>Введите ID ниже и сохраните</li>
          <li>Для работы с заказами: /inbox и /tickets</li>
        </ol>

        <UserTelegramForm
          apiUrl={apiUrl}
          initialTelegramUserId={telegramUserId}
          canEdit={canEdit && botConfigured}
        />
      </CardContent>
    </Card>
  );
}
