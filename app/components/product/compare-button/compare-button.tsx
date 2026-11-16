import { Scale } from "lucide-react";

import { Toggle, type ToggleProps } from "~/components/ui/toggle";

export type CompareButtonProps = Omit<
  ToggleProps,
  "children" | "aria-label" | "aria-pressed" | "pressed" | "defaultPressed" | "variant" | "swatch"
> & {
  active?: boolean;
  /** Назва товару для підпису кнопки. */
  productTitle: string;
};

/** Кругла кнопка 44px «до порівняння». Стан зберігає той, хто її використовує. */
export function CompareButton({ active = false, productTitle, ...props }: CompareButtonProps) {
  return (
    <Toggle
      data-slot="compare-button"
      variant="icon"
      pressed={active}
      aria-label={`${active ? "Прибрати з порівняння" : "Додати до порівняння"}: ${productTitle}`}
      {...props}
    >
      <Scale strokeWidth={2} />
    </Toggle>
  );
}
