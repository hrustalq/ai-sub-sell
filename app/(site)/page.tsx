import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/brand";
import { buildHomeJsonLd } from "@/lib/seo-structured-data";
import {
  ZapIcon,
  LayersIcon,
  PercentIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { getNavbarState } from "@/lib/navbar";
import { getPlans, seedPlansIfEmpty, PROVIDERS } from "@/lib/plans";
import { PricingSection } from "@/components/plans/pricing-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  {
    icon: LayersIcon,
    title: "Несколько провайдеров",
    desc: "Codex, Cursor, Claude — выбирайте сервис под свою задачу",
  },
  {
    icon: PercentIcon,
    title: "Скидки за срок",
    desc: "Чем дольше период — тем выгоднее: до −20% на 12 месяцев",
  },
  {
    icon: ZapIcon,
    title: "Мгновенная активация",
    desc: "Доступ сразу после оплаты через YooKassa",
  },
];

const steps = [
  {
    num: "01",
    title: "Выберите провайдера",
    desc: "Codex, Cursor или Claude — на вкладках в каталоге",
  },
  {
    num: "02",
    title: "Опция и срок",
    desc: "Стандарт или Про, от 1 недели до 12 месяцев",
  },
  {
    num: "03",
    title: "Оплата",
    desc: "Карты, СБП и кошельки через YooKassa",
  },
  {
    num: "04",
    title: "Доступ",
    desc: "Активация сразу после подтверждения платежа",
  },
];

const faq = [
  {
    q: "Какие подписки вы продаёте?",
    a: "Мы предлагаем доступ к нескольким AI-сервисам для разработки: OpenAI Codex, Cursor и Claude. У каждого провайдера — свои опции и лимиты.",
  },
  {
    q: "Как работают скидки за 3, 6 и 12 месяцев?",
    a: "При оплате на длительный срок цена ниже, чем при помесячной оплате: −10% за 3 месяца, −15% за 6 и −20% за год. Старая цена показана зачёркнутой.",
  },
  {
    q: "Планы продлеваются автоматически?",
    a: "Нет. Все тарифы разовые — вы платите только за выбранный период без автосписания.",
  },
  {
    q: "Можно купить несколько подписок?",
    a: "Да, можно оформить любое количество планов у разных провайдеров.",
  },
  {
    q: "Как получить доступ после оплаты?",
    a: "Инструкции по активации приходят после подтверждения платежа. Материалы по настройке — в разделе ниже.",
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

const providerNames = PROVIDERS.map((p) => p.label).join(", ");

export const metadata: Metadata = {
  title: {
    absolute: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

export default async function Home() {
  const navbar = await getNavbarState();
  await seedPlansIfEmpty();
  const plans = await getPlans();

  return (
    <>
      <JsonLd data={buildHomeJsonLd()} />
      <div className="min-h-screen bg-background">
      <section className="bg-muted px-4 py-24 text-center">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
          <Badge variant="secondary" className="px-4 py-1 text-xs uppercase tracking-widest">
            {providerNames}
          </Badge>
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
            Подписки на AI‑инструменты{" "}
            <span className="text-primary">в одном месте</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Codex, Cursor и Claude — сравните опции, выберите срок и оплатите напрямую.
            Скидки при оплате на 3, 6 и 12 месяцев.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="px-8">
              <Link href="#pricing">Смотреть тарифы</Link>
            </Button>
            {navbar.status === "guest" && (
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

      <section className="border-y border-border bg-background px-4 py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
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

      <section className="bg-muted px-4 py-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-3xl font-bold text-foreground">Как это работает</h2>
            <p className="text-muted-foreground">Четыре шага до активации</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="flex flex-col gap-3">
                <span className="text-4xl font-bold leading-none text-primary/20">{num}</span>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-background px-4 py-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-3xl font-bold text-foreground">Тарифы по провайдерам</h2>
            <p className="text-muted-foreground">
              Переключайте вкладки, выбирайте опцию и срок — скидка рассчитывается автоматически
            </p>
          </div>
          <PricingSection plans={plans} />
        </div>
      </section>

      <section className="bg-muted px-4 py-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
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

      <section className="bg-background px-4 py-16">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <h2 className="text-center text-2xl font-bold text-foreground">Частые вопросы</h2>
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

      <section className="bg-primary px-4 py-16 text-center">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6">
          <h2 className="text-3xl font-bold text-primary-foreground">Начните с любого провайдера</h2>
          <p className="text-primary-foreground/70">
            Выберите сервис, опцию и срок — оплата и активация за несколько минут.
          </p>
          <Button asChild size="lg" variant="secondary" className="px-10 font-semibold">
            <Link href="#pricing">К тарифам</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-background px-4 py-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
          <span>Оплата через YooKassa — безопасно и надёжно</span>
        </div>
      </footer>
    </div>
    </>
  );
}
