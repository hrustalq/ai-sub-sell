import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { isSupportEmail } from "@/lib/support/auth";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const signInUrl = new URL("/sign-in", request.url);
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isUserRoute = pathname.startsWith("/user");
  const isSupportRoute = pathname.startsWith("/support");

  if (!session) {
    if (isAdminRoute || isUserRoute || isSupportRoute) {
      signInUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(signInUrl, { status: 302 });
  }

  if (isAdminRoute && !isAdminEmail(session.user.email)) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }

  if (isSupportRoute && !isSupportEmail(session.user.email)) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/user/:path*", "/support/:path*"],
};
