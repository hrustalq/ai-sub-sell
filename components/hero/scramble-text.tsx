"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { stagger } from "motion";
import { cn } from "@/lib/utils";

const DEFAULT_CHARS = "!<>-_\\/[]{}—=+*^?#________";

type ScrambleTextProps = {
  text: string;
  className?: string;
  staggerDelay?: number;
  duration?: number;
  chars?: string;
};

function randomChar(charset: string) {
  return charset[Math.floor(Math.random() * charset.length)] ?? "?";
}

function toDisplay(text: string) {
  return text.split("").map((char) => (char === " " ? "\u00A0" : char));
}

export function ScrambleText({
  text,
  className,
  staggerDelay = 0.05,
  duration = 0.5,
  chars = DEFAULT_CHARS,
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(() => toDisplay(text));
  const frameRef = useRef<number>(0);

  useLayoutEffect(() => {
    const chars_ = text.split("");
    const getDelay = stagger(staggerDelay, { from: "center" });
    const total = chars_.length;
    const startTime = performance.now();

    const charStates = chars_.map((target, index) => ({
      target: target === " " ? "\u00A0" : target,
      delayMs: getDelay(index, total) * 1000,
    }));

    const tick = () => {
      const elapsed = performance.now() - startTime;
      let allDone = true;

      const next = charStates.map(({ target, delayMs }) => {
        if (elapsed < delayMs) {
          allDone = false;
          return randomChar(chars);
        }

        const charElapsed = elapsed - delayMs;
        if (charElapsed >= duration * 1000) {
          return target;
        }

        allDone = false;
        return randomChar(chars);
      });

      setDisplay(next);

      if (!allDone) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [text, staggerDelay, duration, chars]);

  return (
    <span className={cn("inline-flex font-mono tabular-nums", className)} aria-label={text}>
      {display.map((char, index) => (
        <span key={`${text}-${index}`} className="inline-block">
          {char}
        </span>
      ))}
    </span>
  );
}
