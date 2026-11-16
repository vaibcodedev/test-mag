import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

import { switchThumbVariants, switchVariants, type SwitchVariants } from "./switch.variants";

export type SwitchProps = ComponentProps<typeof SwitchPrimitive.Root> & SwitchVariants;

/** Перемикач «увімкнено / вимкнено». Підпис дає <label> або aria-label. */
export function Switch({ className, size = "md", ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(switchVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={switchThumbVariants({ size })} />
    </SwitchPrimitive.Root>
  );
}
