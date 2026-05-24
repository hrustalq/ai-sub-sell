"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppNavItem } from "@/lib/navigation/types";
import { cn } from "@/lib/utils";

type AppNavLinkProps = {
  item: AppNavItem;
  variant: "sidebar" | "bottom";
  onNavigate?: () => void;
};

export function AppNavLink({ item, variant, onNavigate }: AppNavLinkProps) {
  const pathname = usePathname();
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const Icon = item.icon;

  if (variant === "bottom") {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors",
          isActive ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className={cn("size-5", isActive && "stroke-[2.5]")} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}
