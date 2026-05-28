"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ShieldCheckIcon } from "lucide-react";
import type { ProviderMeta } from "@/lib/plans/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrambleText } from "./scramble-text";

const CYCLE_MS = 3200;

type ProviderScrambleHeroProps = {
  providers: ProviderMeta[];
  showSignIn?: boolean;
};

export function ProviderScrambleHero({ providers, showSignIn }: ProviderScrambleHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeProvider = providers[activeIndex];

  const longestLabel = useMemo(
    () => providers.reduce((max, provider) => Math.max(max, provider.label.length), 0),
    [providers],
  );

  useEffect(() => {
    if (providers.length <= 1) return;

    const id = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % providers.length);
    }, CYCLE_MS);

    return () => window.clearInterval(id);
  }, [providers.length]);

  if (!activeProvider) return null;

  return (
    <section className="relative overflow-hidden bg-muted px-4 py-24 text-center sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial-primary-glow"
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Провайдеры
          </p>

          <div
            className="relative flex h-[1.1em] w-full items-center justify-center text-5xl sm:text-7xl md:text-8xl"
            style={{ minWidth: `${longestLabel}ch` }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProvider.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-x-0 flex justify-center"
              >
                <ScrambleText
                  text={activeProvider.label}
                  className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl md:text-8xl"
                  staggerDelay={0.05}
                  duration={0.5}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative mx-auto w-full max-w-lg min-h-12 sm:min-h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={`${activeProvider.id}-desc`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-x-0 top-0 text-sm text-muted-foreground sm:text-base"
              >
                {activeProvider.description}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {providers.map((provider, index) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                index === activeIndex
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {provider.label}
            </button>
          ))}
        </div>

        <div className="flex max-w-2xl flex-col items-center gap-4">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
            Подписки на AI‑инструменты{" "}
            <span className="text-primary">в одном месте</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Сравните опции, выберите срок и оплатите напрямую. Скидки при оплате на 3, 6 и 12
            месяцев.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="px-8">
            <Link href="#pricing">Смотреть тарифы</Link>
          </Button>
          {showSignIn && (
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link href="/sign-in">Войти</Link>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheckIcon className="size-4 text-primary" />
          Защищённая оплата
        </div>
      </div>
    </section>
  );
}
