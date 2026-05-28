"use client";

import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type AnimatedPriceProps = {
  value: number;
  currency: string;
  className?: string;
  compareValue?: number;
  reserveValues?: number[];
  strikethrough?: boolean;
  onSettled?: () => void;
};

type DigitSegment = {
  kind: "digit";
  digit: number;
  place: number;
};

type TextSegment = {
  kind: "text";
  value: string;
  key: string;
};

type Segment = DigitSegment | TextSegment;

type Trend = 1 | -1 | 0;

const BASE_OFFSET = 10;
const DIGIT_STRIP = Array.from({ length: 30 }, (_, index) => index % 10);

function createFormatter(currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  });
}

function digitCount(value: number) {
  return String(Math.abs(Math.round(value))).length;
}

function widestFormatted(values: number[], currency: string) {
  const formatter = createFormatter(currency);
  let widest = "";

  for (const value of values) {
    const formatted = formatter.format(value);
    if (formatted.length > widest.length) widest = formatted;
  }

  return widest;
}

function pickLayoutValue(a: number, b: number) {
  return digitCount(a) >= digitCount(b) ? a : b;
}

function toSegments(value: number, currency: string): Segment[] {
  const parts = createFormatter(currency).formatToParts(value);
  const digits = String(Math.abs(Math.round(value))).split("");
  let digitIndex = 0;
  const segments: Segment[] = [];

  for (const [partIndex, part] of parts.entries()) {
    if (part.type === "integer") {
      for (const char of part.value) {
        const place = digits.length - 1 - digitIndex;
        digitIndex += 1;
        segments.push({ kind: "digit", digit: Number(char), place });
      }
      continue;
    }

    segments.push({ kind: "text", value: part.value, key: `${part.type}-${partIndex}` });
  }

  return segments;
}

function segmentsToPlaceMap(segments: Segment[]) {
  const map = new Map<number, number>();
  for (const segment of segments) {
    if (segment.kind === "digit") map.set(segment.place, segment.digit);
  }
  return map;
}

function getTrend(from: number, to: number): Trend {
  if (to > from) return 1;
  if (to < from) return -1;
  return 0;
}

function resolveIndices(prev: number, next: number, trend: Trend) {
  const settled = BASE_OFFSET + next;

  if (trend === 0 || prev === next) {
    return { start: settled, end: settled, steps: 0 };
  }

  const start = BASE_OFFSET + prev;
  let end = BASE_OFFSET + next;

  if (trend === 1 && next <= prev) {
    end = BASE_OFFSET + next + 10;
  } else if (trend === -1 && next >= prev) {
    end = BASE_OFFSET + next - 10;
  }

  return { start, end, steps: Math.abs(end - start) };
}

function OdometerDigit({
  digit,
  prevDigit,
  trend,
}: {
  digit: number;
  prevDigit: number | undefined;
  trend: Trend;
}) {
  const { start, end, steps } = useMemo(() => {
    const prev = prevDigit ?? 0;
    return resolveIndices(prev, digit, trend);
  }, [digit, prevDigit, trend]);

  const shouldAnimate = steps > 0;

  return (
    <span className="relative inline-block h-[1em] w-[0.58em] shrink-0 overflow-hidden align-bottom">
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        initial={shouldAnimate ? { y: `-${start}em` } : false}
        animate={{ y: `-${end}em` }}
        transition={{
          type: "tween",
          ease: [0.22, 1, 0.36, 1],
          duration: shouldAnimate ? Math.min(0.07 * steps + 0.18, 0.85) : 0,
        }}
      >
        {DIGIT_STRIP.map((value, index) => (
          <span
            key={index}
            className="flex h-[1em] w-full items-center justify-center leading-none"
          >
            {value}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function ExitingDigit({ digit }: { digit: number }) {
  return (
    <motion.span
      className="relative inline-block h-[1em] w-[0.58em] shrink-0 overflow-hidden align-bottom"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      <span className="absolute inset-0 flex items-center justify-center leading-none">
        {digit}
      </span>
    </motion.span>
  );
}

export function AnimatedPrice({
  value,
  currency,
  className,
  compareValue = value,
  reserveValues = [],
  strikethrough = false,
  onSettled,
}: AnimatedPriceProps) {
  const formatter = useMemo(() => createFormatter(currency), [currency]);
  const segments = useMemo(() => toSegments(value, currency), [value, currency]);
  const prevByPlace = useMemo(
    () => segmentsToPlaceMap(toSegments(compareValue, currency)),
    [compareValue, currency],
  );
  const valueByPlace = useMemo(() => segmentsToPlaceMap(segments), [segments]);
  const trend = getTrend(compareValue, value);
  const isAnimating = compareValue !== value;

  const reserveText = useMemo(
    () => widestFormatted([value, ...reserveValues], currency),
    [value, reserveValues, currency],
  );

  const renderSegments = useMemo(() => {
    if (!isAnimating) return segments;
    return toSegments(pickLayoutValue(value, compareValue), currency);
  }, [isAnimating, segments, value, compareValue, currency]);

  const targetDigitCount = digitCount(value);
  const compareDigitCount = digitCount(compareValue);

  const maxSteps = useMemo(() => {
    if (!isAnimating) return 0;

    return renderSegments.reduce((max, segment) => {
      if (segment.kind !== "digit") return max;

      if (
        trend === -1 &&
        compareDigitCount > targetDigitCount &&
        segment.place >= targetDigitCount
      ) {
        return max;
      }

      const prev = prevByPlace.get(segment.place) ?? 0;
      const next = valueByPlace.get(segment.place) ?? 0;
      const { steps } = resolveIndices(prev, next, trend);
      return Math.max(max, steps);
    }, 0);
  }, [
    isAnimating,
    renderSegments,
    prevByPlace,
    valueByPlace,
    trend,
    compareDigitCount,
    targetDigitCount,
  ]);

  useEffect(() => {
    if (!isAnimating) return;
    const timeout = window.setTimeout(
      () => onSettled?.(),
      Math.min(0.07 * maxSteps + 0.28, 0.95) * 1000,
    );
    return () => window.clearTimeout(timeout);
  }, [isAnimating, maxSteps, onSettled, value, compareValue]);

  return (
    <span
      className={cn("inline-grid max-w-full tabular-nums", className)}
      aria-label={formatter.format(value)}
    >
      <span
        className="invisible col-start-1 row-start-1 whitespace-nowrap select-none"
        aria-hidden
      >
        {reserveText}
      </span>
      <span className="col-start-1 row-start-1 flex min-w-full justify-end">
        <span
          className={cn(
            "inline-flex items-baseline",
            strikethrough && "relative",
          )}
        >
          {renderSegments.map((segment) => {
            if (segment.kind === "digit") {
              const prevDigit = prevByPlace.get(segment.place);
              const targetDigit = valueByPlace.get(segment.place);
              const isExpiringLeading =
                isAnimating &&
                trend === -1 &&
                compareDigitCount > targetDigitCount &&
                segment.place >= targetDigitCount;

              if (isExpiringLeading && prevDigit !== undefined) {
                return (
                  <ExitingDigit key={`place-${segment.place}`} digit={prevDigit} />
                );
              }

              return (
                <OdometerDigit
                  key={`place-${segment.place}`}
                  digit={targetDigit ?? 0}
                  prevDigit={prevDigit}
                  trend={trend}
                />
              );
            }

            return (
              <span key={segment.key} className="inline-block shrink-0">
                {segment.value}
              </span>
            );
          })}
          {strikethrough && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current"
            />
          )}
        </span>
      </span>
    </span>
  );
}
