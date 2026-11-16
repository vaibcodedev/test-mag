import { Progress as ProgressPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import {
  progressIndicatorVariants,
  progressVariants,
  type ProgressVariants,
} from "./progress.variants";

const FULL_PERCENT = 100;
const DEFAULT_MAX = 100;

export type ProgressProps = ComponentProps<typeof ProgressPrimitive.Root> & ProgressVariants;

/**
 * Тонка смуга поступу: «до безкоштовної доставки», заповнення порівняння, кроки оформлення.
 * Потребує підпису: aria-label або aria-labelledby. Без value стан невизначений.
 */
export function Progress({
  className,
  value,
  max = DEFAULT_MAX,
  tone = "light",
  ...props
}: ProgressProps) {
  const percent =
    value == null ? 0 : Math.min(FULL_PERCENT, Math.max(0, (value / max) * FULL_PERCENT));

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-tone={tone}
      value={value}
      max={max}
      className={cn(progressVariants({ tone }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={progressIndicatorVariants({ tone })}
        style={{ transform: `translateX(-${FULL_PERCENT - percent}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
