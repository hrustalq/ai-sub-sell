import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ModeToggle } from "@/components/mode-toggle";
import { getNavbarState } from "@/lib/navbar";
import { UserNavMenu } from "@/components/layout/user-nav-menu";
import { Button } from "@/components/ui/button";

export async function SiteNavbar() {
  const state = await getNavbarState();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
          <BrandLogo />
        </Link>

        <div className="flex items-center gap-2">
          <ModeToggle />
          {state.status === "guest" ? (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href="/sign-in">Войти</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">Регистрация</Link>
              </Button>
            </>
          ) : (
            <UserNavMenu
              user={state.user}
              isAdmin={state.isAdmin}
              isSupport={state.isSupport}
            />
          )}
        </div>
      </div>
    </nav>
  );
}
