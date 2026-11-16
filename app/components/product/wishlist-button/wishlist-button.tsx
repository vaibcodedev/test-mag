import { Heart } from "lucide-react";

import { Toggle, type ToggleProps } from "~/components/ui/toggle";

export type WishlistButtonProps = Omit<
  ToggleProps,
  "children" | "aria-label" | "aria-pressed" | "pressed" | "defaultPressed" | "variant" | "swatch"
> & {
  active?: boolean;
  /** Назва товару для підпису кнопки. */
  productTitle: string;
};

/** Кругла кнопка 44px «в обране». Стан зберігає той, хто її використовує. */
export function WishlistButton({ active = false, productTitle, ...props }: WishlistButtonProps) {
  return (
    <Toggle
      data-slot="wishlist-button"
      variant="icon"
      pressed={active}
      aria-label={`${active ? "Прибрати з обраного" : "Додати в обране"}: ${productTitle}`}
      {...props}
    >
      <Heart strokeWidth={2} />
    </Toggle>
  );
}
