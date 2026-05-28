import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export type UserProfileData = {
  name: string;
  email: string;
  image: string | null;
  initials: string;
  emailVerified: boolean;
  isAdmin: boolean;
  adminPanelHref?: string;
  createdAt: string | null;
};

export function UserProfileCard({ user }: { user: UserProfileData }) {
  return (
    <Card className="flex h-full min-h-0 flex-1 flex-col py-0">
      <CardContent className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar size="lg" className="shrink-0">
            {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
            <AvatarFallback className="text-sm font-medium">{user.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-h4 font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-sm leading-relaxed text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {user.emailVerified ? (
                <Badge variant="secondary">Email подтверждён</Badge>
              ) : (
                <Badge variant="outline">Email не подтверждён</Badge>
              )}
              {user.isAdmin && <Badge>Администратор</Badge>}
            </div>
          </div>
        </div>

        <Separator />

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-0.5 font-medium text-foreground">{user.email}</dd>
          </div>
          {user.createdAt && (
            <div>
              <dt className="text-muted-foreground">Дата регистрации</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {format(new Date(user.createdAt), "d MMMM yyyy", { locale: ru })}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/user/payments">Мои платежи</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/#pricing">К тарифам</Link>
          </Button>
          {user.isAdmin && user.adminPanelHref && (
            <Button asChild variant="outline" size="sm">
              <Link href={user.adminPanelHref}>Админ-панель</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
