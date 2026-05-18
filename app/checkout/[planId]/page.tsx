import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { CheckIcon, ShieldCheckIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { getPlan, formatPrice } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const plan = getPlan(planId);
  if (!plan) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/checkout/${planId}`);
  }

  return (
    <main className="min-h-screen bg-muted px-4 py-16">
      <div className="mx-auto max-w-lg flex flex-col gap-8">
        <div>
          <Link
            href="/#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Назад к тарифам
          </Link>
        </div>

        <Card className={plan.highlight ? "border-2 border-primary" : ""}>
          <CardHeader>
            <CardTitle className="text-xl">Оформление заказа</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Order summary */}
            <div className="rounded-lg bg-muted p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{plan.name}</span>
                {plan.badge && (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                    {plan.badge}
                  </span>
                )}
              </div>
              <ul className="flex flex-col gap-1">
                {plan.limits.map((l) => (
                  <li key={l} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckIcon className="size-4 shrink-0 text-primary" />
                    {l}
                  </li>
                ))}
              </ul>
              <div className="border-t border-border pt-3 flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Итого</span>
                <span className="text-2xl font-bold text-foreground">
                  {formatPrice(plan.price, plan.currency)}
                </span>
              </div>
            </div>

            {/* Account */}
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Аккаунт</p>
              <p className="text-sm font-medium text-foreground">{session.user.email}</p>
            </div>

            {/* Pay button */}
            <CheckoutForm plan={plan} />

            {/* Trust */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheckIcon className="size-4 text-primary" />
              Безопасная оплата через YooKassa
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
