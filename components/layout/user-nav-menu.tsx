"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  UserIcon,
  TagIcon,
  CreditCardIcon,
} from "lucide-react";
import { useUnreadSummary } from "@/lib/orders/hooks";
import type { NavbarUser } from "@/lib/navbar-types";
import { routes } from "@/lib/routes";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserNavMenuProps = {
  user: NavbarUser;
  isAdmin: boolean;
  isSupport?: boolean;
  adminPanelHref?: string;
};

export function UserNavMenu({
  user,
  isAdmin,
  isSupport = false,
  adminPanelHref = routes.admin.home,
}: UserNavMenuProps) {
  const router = useRouter();
  const { totalUnread: buyerUnread } = useUnreadSummary({ viewer: "buyer" });
  const { totalUnread: supportUnread } = useUnreadSummary({
    viewer: "seller",
    enabled: isSupport,
  });

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar size="sm">
            {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
            <AvatarFallback className="text-xs font-medium">{user.initials}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Меню аккаунта</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="truncate font-medium text-foreground">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/user/profile">
              <UserIcon />
              Профиль
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/user/payments" className="flex w-full items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCardIcon />
                Платежи
              </span>
              {buyerUnread > 0 && (
                <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  {buyerUnread}
                </span>
              )}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/#pricing">
              <TagIcon />
              Тарифы
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href={adminPanelHref} className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <LayoutDashboardIcon />
                  Админ-панель
                </span>
                {isSupport && supportUnread > 0 && (
                  <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    {supportUnread}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOutIcon />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
