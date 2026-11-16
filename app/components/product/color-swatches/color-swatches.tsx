import type { ComponentProps, CSSProperties } from "react";

import { toggleSwatchVariants } from "~/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { cn } from "~/lib/utils";

export type ColorSwatch = {
  /** Назва кольору: «Синій титан». */
  name: string;
  /** Значення з метаполя custom.color_swatches. Це дані товару, а не колір інтерфейсу. */
  hex: string;
};

export type ColorSwatchesProps = Omit<
  ComponentProps<"div">,
  "onChange" | "children" | "defaultValue" | "dir"
> & {
  colors: readonly ColorSwatch[];
  /** Назва вибраного кольору. */
  value?: string;
  onChange?: (name: string) => void;
  /** Підпис групи для читачів екрана. */
  label?: string;
  /** На ink кільце вибору lime, на світлому — blue. */
  onDark?: boolean;
};

/** Вибір кольору. Без onChange — лише перелік кольорів (у картці товару). */
export function ColorSwatches({
  colors,
  value,
  onChange,
  label = "Колір",
  onDark = false,
  className,
  ...props
}: ColorSwatchesProps) {
  if (colors.length === 0) return null;

  if (!onChange) {
    return (
      <div
        data-slot="color-swatches"
        role="img"
        aria-label={`${label}: ${colors.map((color) => color.name).join(", ")}`}
        className={cn("flex items-center gap-1", className)}
        {...props}
      >
        {colors.map((color) => (
          // Та сама крапка, що в ToggleSwatch, лише менша: у картці це перелік, а не вибір.
          <span
            key={color.name}
            data-slot="toggle-swatch"
            className={cn(toggleSwatchVariants({ onDark }), "size-4 outline-0")}
            style={{ "--swatch": color.hex } as CSSProperties}
          />
        ))}
      </div>
    );
  }

  return (
    <ToggleGroup
      data-slot="color-swatches"
      type="single"
      variant="swatch"
      onDark={onDark}
      aria-label={label}
      // Radix дозволяє зняти вибір повторним натисканням; колір має лишатися вибраним.
      value={value ?? ""}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      className={className}
      {...props}
    >
      {colors.map((color) => (
        <ToggleGroupItem
          key={color.name}
          value={color.name}
          swatch={color.hex}
          aria-label={color.name}
          title={color.name}
        />
      ))}
    </ToggleGroup>
  );
}
