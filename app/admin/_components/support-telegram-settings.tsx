import { getSupportBotToken } from "@/lib/telegram/config";
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
  const botConfigured = Boolean(getSupportBotToken());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Бот поддержки в Telegram</CardTitle>
        <CardDescription>
          Привяжите Telegram ID, чтобы получать уведомления и отвечать покупателям из бота.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!botConfigured && (
          <p className="text-sm text-muted-foreground">
            Бот поддержки не настроен на сервере (TELEGRAM_SUPPORT_BOT_TOKEN).
          </p>
        )}

        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Откройте @userinfobot в Telegram и скопируйте ваш числовой ID</li>
          <li>Найдите бота поддержки и отправьте ему /start</li>
          <li>Введите ID ниже и сохраните</li>
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
