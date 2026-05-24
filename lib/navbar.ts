import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";
import { isSupportEmail } from "@/lib/support/auth";
import type { NavbarState } from "@/lib/navbar-types";

export type { NavbarState, NavbarUser } from "@/lib/navbar-types";

function getInitials(name: string, email: string): string {
  const trimmed = name.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export async function getNavbarState(): Promise<NavbarState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { status: "guest" };
  }

  const { user } = session;
  return {
    status: "authenticated",
    user: {
      name: user.name,
      email: user.email,
      image: user.image ?? null,
      initials: getInitials(user.name, user.email),
    },
    isAdmin: isAdminEmail(user.email),
    isSupport: isSupportEmail(user.email),
  };
}
