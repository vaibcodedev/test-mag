import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import { wordmarkVariants, type WordmarkVariants } from "./wordmark.variants";

export type WordmarkProps = Omit<ComponentProps<"span">, "children"> & WordmarkVariants;

/**
 * Логотип «ionov.» — слово малими літерами й акцентна крапка.
 * Сам посиланням не є: обгортку <Link> ставить той, хто його використовує.
 */
export function Wordmark({ className, tone = "ink", size = "sm", ...props }: WordmarkProps) {
  return (
    <span
      data-slot="wordmark"
      role="img"
      aria-label="Ionov Store"
      className={cn(wordmarkVariants({ tone, size }), className)}
      {...props}
    >
      <span aria-hidden="true">ionov</span>
      <span aria-hidden="true" className="text-(--wordmark-accent)">
        .
      </span>
    </span>
  );
}
