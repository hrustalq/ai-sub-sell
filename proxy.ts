import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserPermissionsById } from "@/lib/rbac";
import { legacySupportPath, routes } from "@/lib/routes";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const signInUrl = new URL("/sign-in", request.url);
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith(routes.admin.home);
  const isUserRoute = pathname.startsWith("/user");
  const legacySupportPathname = legacySupportPath(pathname);
  const isLegacySupportRoute = legacySupportPathname !== null;

  if (!session) {
    if (isAdminRoute || isUserRoute || isLegacySupportRoute) {
      signInUrl.searchParams.set(
        "callbackUrl",
        isLegacySupportRoute ? legacySupportPathname : pathname,
      );
    }
    return NextResponse.redirect(signInUrl, { status: 302 });
  }

  if (isLegacySupportRoute) {
    return NextResponse.redirect(new URL(legacySupportPathname, request.url), { status: 308 });
  }

  if (isAdminRoute) {
    const permissions = await getUserPermissionsById(session.user.id, session.user.email);
    if (!permissions?.canAccessAdminPanel) {
      return NextResponse.redirect(new URL("/", request.url), { status: 302 });
    }

    const isAdminOnlyRoute =
      pathname === routes.admin.home ||
      pathname.startsWith(`${routes.admin.plans}/`) ||
      pathname === routes.admin.plans ||
      pathname.startsWith(`${routes.admin.users}/`) ||
      pathname === routes.admin.users ||
      pathname.startsWith(`${routes.admin.payments}/`) ||
      pathname === routes.admin.payments;

    const isSupportRoute = pathname.startsWith(routes.admin.support);

    if (isAdminOnlyRoute && !permissions.canAccessAdmin) {
      return NextResponse.redirect(new URL(routes.admin.support, request.url), { status: 302 });
    }

    if (isSupportRoute && !permissions.canAccessSupport) {
      return NextResponse.redirect(new URL(routes.admin.home, request.url), { status: 302 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/user/:path*", "/support/:path*"],
};
