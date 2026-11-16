import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

export function RadioGroup({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-1", className)}
      {...props}
    />
  );
}

/** Коло 24px; псевдоелемент розширює ціль натискання до 44px. */
export function RadioGroupItem({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer relative flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-pill border border-ink-2 bg-surface transition-colors duration-150 outline-none after:absolute after:-inset-2.5 hover:border-blue focus-visible:shadow-focus-offset disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-danger data-checked:border-blue data-checked:bg-blue",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="size-2.5 rounded-pill bg-surface"
      />
    </RadioGroupPrimitive.Item>
  );
}
