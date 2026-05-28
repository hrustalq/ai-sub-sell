import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { AdminUserDetailRecord } from "@/lib/admin/types";
import { formatPrice } from "@/lib/plans/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRbacForm } from "@/app/admin/_components/user-rbac-form";
import { UserTelegramForm } from "@/app/admin/_components/user-telegram-form";

type UserSettingsCardProps = {
  user: AdminUserDetailRecord;
  canManageRbac: boolean;
};

export function UserSettingsCard({ user, canManageRbac }: UserSettingsCardProps) {
  const showTelegram = user.rbacSupport || user.rbacAdmin || user.isCoreAdmin;
  const canEditTelegram = canManageRbac && showTelegram;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            {!user.emailVerified && <Badge variant="outline">Email не подтверждён</Badge>}
            {user.isCoreAdmin && <Badge>Core admin</Badge>}
            {user.rbacAdmin && <Badge variant="secondary">Администратор</Badge>}
            {user.rbacSupport && <Badge variant="secondary">Поддержка</Badge>}
            {user.telegramLinked && <Badge variant="outline">Telegram</Badge>}
          </div>

          <dl className="grid gap-3">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Регистрация</dt>
              <dd>{format(new Date(user.createdAt), "d MMMM yyyy", { locale: ru })}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Заказы</dt>
              <dd>{user.ordersCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Оплачено</dt>
              <dd>
                {user.paidTotal > 0 ? formatPrice(user.paidTotal, "RUB") : "—"}
              </dd>
            </div>
            {user.telegramUserId && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Telegram ID</dt>
                <dd className="font-mono">{user.telegramUserId}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {canManageRbac && !user.isCoreAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Права доступа</CardTitle>
            <CardDescription>
              Управление доступом к разделам админ-панели для этого пользователя.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserRbacForm
              userId={user.id}
              initialRbacAdmin={user.rbacAdmin}
              initialRbacSupport={user.rbacSupport}
            />
          </CardContent>
        </Card>
      ) : canManageRbac && user.isCoreAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Права доступа</CardTitle>
            <CardDescription>
              Core admin определяется через переменную окружения CORE_ADMIN_EMAILS и не
              редактируется здесь.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {showTelegram && (
        <Card className={canManageRbac && !user.isCoreAdmin ? "lg:col-span-2" : undefined}>
          <CardHeader>
            <CardTitle>Telegram поддержки</CardTitle>
            <CardDescription>
              ID для доступа к боту поддержки и уведомлениям о сообщениях покупателей.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserTelegramForm
              apiUrl={`/api/admin/users/${user.id}/telegram`}
              initialTelegramUserId={user.telegramUserId}
              canEdit={canEditTelegram}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
