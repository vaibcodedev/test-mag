import { Slot, Toggle as TogglePrimitive } from "radix-ui";
import type { ComponentProps, CSSProperties } from "react";

import { cn } from "~/lib/utils";

import { toggleSwatchVariants, toggleVariants, type ToggleVariants } from "./toggle.variants";

export type ToggleSwatchProps = {
  /** Колір крапки для variant="swatch": дані товару (hex із метаполя), а не колір інтерфейсу. */
  swatch?: string;
  /**
   * Значення недоступне (немає в наявності, немає такої комбінації): закреслене й приглушене,
   * але натискне. Те саме дає атрибут `data-available="false"`.
   */
  unavailable?: boolean;
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
 * Кнопка-перемикач із aria-pressed. Для variant="icon", "swatch" і "thumbnail" потрібен
 * aria-label. З `asChild` коренем стає дитина (наприклад, посилання); крапка кольору
 * потрапляє всередину неї — для цього children загорнуті в Slottable.
 */
export function Toggle({
  className,
  variant = "pill",
  onDark = false,
  swatch,
  unavailable,
  children,
  ...props
}: ToggleProps) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      data-variant={variant}
      data-available={unavailable ? "false" : undefined}
      className={cn(toggleVariants({ variant, onDark }), className)}
      {...props}
    >
      {swatch ? <ToggleSwatch color={swatch} onDark={onDark} /> : null}
      <Slot.Slottable>{children}</Slot.Slottable>
    </TogglePrimitive.Root>
  );
}
