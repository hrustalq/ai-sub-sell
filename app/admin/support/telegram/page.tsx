import { requireSupport } from "@/lib/admin";
import db from "@/lib/db";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { SupportTelegramSettings } from "@/app/admin/_components/support-telegram-settings";

export default async function AdminSupportTelegramPage() {
  const { session } = await requireSupport();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { telegramUserId: true },
  });

  return (
    <AdminPageShell
      title="Telegram"
      description="Привязка аккаунта к боту поддержки для уведомлений и ответов"
    >
      <SupportTelegramSettings
        telegramUserId={user?.telegramUserId ?? null}
        apiUrl="/api/admin/me/telegram"
      />
    </AdminPageShell>
  );
}
