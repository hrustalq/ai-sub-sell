"use client";

import {
  CreditCardIcon,
  KeyRoundIcon,
  LayersIcon,
  SlidersHorizontalIcon,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";

export type HowItWorksStep = {
  num: string;
  title: string;
  desc: string;
};

type HowItWorksSectionProps = {
  steps: HowItWorksStep[];
};

const STEP_ICONS: LucideIcon[] = [
  LayersIcon,
  SlidersHorizontalIcon,
  CreditCardIcon,
  KeyRoundIcon,
];

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const headerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

const lineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.9, ease: EASE_OUT, delay: 0.15 },
  },
};

export function HowItWorksSection({ steps }: HowItWorksSectionProps) {
  return (
    <section className="bg-muted px-4 py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <motion.header
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={headerVariants}
          className="flex flex-col gap-2 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Процесс
          </p>
          <h2 className="text-3xl font-bold text-foreground">Как это работает</h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Четыре шага от выбора провайдера до активации доступа
          </p>
        </motion.header>

        <div className="relative">
          <motion.div
            aria-hidden
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={lineVariants}
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-10 hidden h-px origin-left bg-border lg:block"
          />

          <motion.ol
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={listVariants}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
          >
            {steps.map((step, index) => {
              const Icon = STEP_ICONS[index] ?? LayersIcon;

              return (
                <motion.li key={step.num} variants={stepVariants} className="relative">
                  <article className="relative flex h-full flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-xs">
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold tabular-nums text-primary-foreground shadow-xs ring-4 ring-card">
                        {step.num}
                      </div>
                      <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                        <Icon className="size-4" aria-hidden />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Шаг {index + 1}
                      </p>
                      <h3 className="text-lg font-semibold leading-snug text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                    </div>
                  </article>
                </motion.li>
              );
            })}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}
