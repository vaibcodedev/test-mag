import { Leaf } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import { wordmarkVariants, type WordmarkVariants } from "./wordmark.variants";

export type WordmarkProps = Omit<ComponentProps<"span">, "children"> &
  WordmarkVariants & {
    /** Листок біля слова (шапка) або крапка після нього (футер). */
    mark?: "leaf" | "dot";
  };

/** Логотип «сад». Сам посиланням не є: обгортку <Link> ставить той, хто його використовує. */
export function Wordmark({
  className,
  tone = "ink",
  size = "sm",
  mark = "leaf",
  ...props
}: WordmarkProps) {
  return (
    <span
      data-slot="wordmark"
      role="img"
      aria-label="Сад"
      className={cn(wordmarkVariants({ tone, size }), className)}
      {...props}
    >
      <span aria-hidden="true">сад</span>
      {mark === "leaf" ? (
        <Leaf
          aria-hidden="true"
          strokeWidth={2}
          className="ms-[0.06em] size-[0.56em] -translate-y-[0.5em] fill-(--wordmark-accent) text-(--wordmark-accent)"
        />
      ) : (
        <span aria-hidden="true" className="text-(--wordmark-accent)">
          .
        </span>
      )}
    </span>
  );
}
