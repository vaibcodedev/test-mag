import { Toggle as TogglePrimitive } from "radix-ui";
import type { ComponentProps, CSSProperties } from "react";

import { cn } from "~/lib/utils";

import { toggleSwatchVariants, toggleVariants, type ToggleVariants } from "./toggle.variants";

export type ToggleSwatchProps = {
  /** Колір крапки для variant="swatch": дані товару (hex із метаполя), а не колір інтерфейсу. */
  swatch?: string;
};

/** Крапка кольору. Спільна для Toggle і ToggleGroupItem. */
export function ToggleSwatch({ color, onDark }: { color: string; onDark?: boolean | null }) {
  return (
    <span
      data-slot="toggle-swatch"
      aria-hidden="true"
      className={toggleSwatchVariants({ onDark: onDark ?? false })}
      style={{ "--swatch": color } as CSSProperties}
    />
  );
}

export type ToggleProps = ComponentProps<typeof TogglePrimitive.Root> &
  ToggleVariants &
  ToggleSwatchProps;

/**
 * Кнопка-перемикач із aria-pressed. Для variant="icon" і "swatch" потрібен aria-label.
 */
export function Toggle({
  className,
  variant = "pill",
  onDark = false,
  swatch,
  children,
  ...props
}: ToggleProps) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      data-variant={variant}
      className={cn(toggleVariants({ variant, onDark }), className)}
      {...props}
    >
      {swatch ? <ToggleSwatch color={swatch} onDark={onDark} /> : null}
      {children}
    </TogglePrimitive.Root>
  );
}
