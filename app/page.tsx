import Link from "next/link";
import { headers } from "next/headers";
import {
  CheckIcon,
  ZapIcon,
  BrainIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { PLANS, formatPrice } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  {
    icon: ZapIcon,
    title: "Строй быстрее",
    desc: "Высокий дневной лимит — больше запросов без остановок",
  },
  {
    icon: BrainIcon,
    title: "Рефакторинг без ограничений",
    desc: "Достаточно запросов для полного рефакторинга крупного проекта",
  },
  {
    icon: SettingsIcon,
    title: "Автоматизируй рабочие процессы",
    desc: "Интегрируй в CI/CD и автоматизируй рутину",
  },
];

const steps = [
  { num: "01", title: "Выбери тариф", desc: "4 варианта — от пробного до максимального" },
  { num: "02", title: "Войди или зарегистрируйся", desc: "30 секунд — только email и пароль" },
  { num: "03", title: "Оплати через YooKassa", desc: "Карты, СБП, электронные кошельки" },
  { num: "04", title: "Получи доступ мгновенно", desc: "Активация сразу после подтверждения" },
];

const faq = [
  {
    q: "Что такое Codex Access?",
    a: "Codex Access — подписка на расширенные лимиты использования Codex для вашего рабочего процесса. После покупки вы получаете увеличенные дневные и недельные квоты.",
  },
  {
    q: "Как получить доступ после оплаты?",
    a: "Доступ активируется автоматически после подтверждения платежа. Подробные инструкции по настройке смотрите в разделе «Материалы» ниже.",
  },
  {
    q: "Планы автоматически продлеваются?",
    a: "Нет. Все планы — разовые. Вы платите только за выбранный период без автоматического списания.",
  },
  {
    q: "Можно ли купить несколько планов?",
    a: "Да, вы можете приобрести любой план в любой момент.",
  },
  {
    q: "Что такое транзитная платформа?",
    a: "Транзитная платформа — дополнительный сервис для расширенной работы с Codex. Подробнее в разделе «Материалы».",
  },
];

const resources = [
  {
    label: "Руководство по переносу и обмену Codex",
    href: "https://www.kdocs.cn/l/csBw2oPEKKGI",
  },
  {
    label: "Настройка Codex — три техники оптимизации",
    href: "https://www.kdocs.cn/l/cjob78PimNvA",
  },
  {
    label: "Транзитная платформа",
    href: "https://apexapi.roixw.com/",
  },
];

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-bold text-foreground tracking-tight">
            Codex<span className="text-primary">.</span>
          </span>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:block">
                  {user.email}
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link href="/#pricing">Купить план</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/sign-in">Войти</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/sign-up">Регистрация</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-muted px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl flex flex-col items-center gap-6">
          <Badge variant="secondary" className="px-4 py-1 text-xs uppercase tracking-widest">
            Codex Access Plans
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl leading-tight">
            Профессиональные лимиты{" "}
            <span className="text-primary">для AI-разработки</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Покупай доступ напрямую — без посредников, без ожидания. Мгновенная
            активация после оплаты через YooKassa.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="px-8">
              <Link href="#pricing">Выбрать план</Link>
            </Button>
            {!user && (
              <Button asChild size="lg" variant="outline" className="px-8">
                <Link href="/sign-in">Войти</Link>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheckIcon className="size-4 text-primary" />
            Безопасная оплата через YooKassa
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-background px-4 py-14">
        <div className="mx-auto max-w-5xl grid grid-cols-1 gap-8 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-xl bg-primary/10 p-3">
                <Icon className="size-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted px-4 py-20">
        <div className="mx-auto max-w-5xl flex flex-col gap-12">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-foreground">Как это работает</h2>
            <p className="text-muted-foreground">Четыре шага до активации</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="flex flex-col gap-3">
                <span className="text-4xl font-bold text-primary/20 leading-none">{num}</span>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-background px-4 py-20">
        <div className="mx-auto max-w-5xl flex flex-col gap-12">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-foreground">Выбери свой план</h2>
            <p className="text-muted-foreground">
              Недельный — отличный старт. Месячные дают наибольшую выгоду.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(PLANS).map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${plan.highlight ? "border-2 border-primary shadow-xs" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground whitespace-nowrap">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <CardHeader className="pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-card-foreground leading-snug">
                      {plan.name}
                    </span>
                    {plan.tag && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {plan.tag}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 flex-1">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="mb-1 text-sm text-muted-foreground">
                      / {plan.period}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1.5 flex-1">
                    {plan.limits.map((limit) => (
                      <li key={limit} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckIcon className="size-4 shrink-0 text-primary" />
                        {limit}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="w-full mt-auto"
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    <Link href={`/checkout/${plan.id}`}>Купить</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="bg-muted px-4 py-16">
        <div className="mx-auto max-w-5xl flex flex-col gap-8">
          <h2 className="text-2xl font-bold text-foreground">Материалы</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {resources.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-xs"
              >
                <span className="mt-0.5 size-2 shrink-0 rounded-full bg-primary transition-opacity group-hover:opacity-70" />
                <span className="text-sm font-medium text-card-foreground transition-colors group-hover:text-primary">
                  {label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background px-4 py-16">
        <div className="mx-auto max-w-2xl flex flex-col gap-8">
          <h2 className="text-2xl font-bold text-foreground text-center">Частые вопросы</h2>
          <Accordion type="single" collapsible>
            {faq.map(({ q, a }, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-foreground">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-primary px-4 py-16 text-center">
        <div className="mx-auto max-w-xl flex flex-col items-center gap-6">
          <h2 className="text-3xl font-bold text-primary-foreground">Начни прямо сейчас</h2>
          <p className="text-primary-foreground/70">
            Выбери план и получи профессиональные лимиты для AI-разработки уже сегодня.
          </p>
          <Button asChild size="lg" variant="secondary" className="px-10 font-semibold">
            <Link href="#pricing">Выбрать план</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-4 py-6">
        <div className="mx-auto max-w-5xl flex flex-col gap-1 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Codex Access Plans</span>
          <span>Оплата через YooKassa — безопасно и надёжно</span>
        </div>
      </footer>
    </div>
  );
}
