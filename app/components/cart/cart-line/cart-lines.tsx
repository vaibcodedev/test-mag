import type { ComponentProps } from "react";

import { lineErrorMessage } from "~/components/cart/cart-errors";
import { ItemGroup } from "~/components/ui/item";
import { useCart, useCartForm } from "~/lib/cart";
import { cn } from "~/lib/utils";

import { CartLine, type CartLineProps } from "./cart-line";

export type CartLinesProps = Omit<ComponentProps<"ul">, "children"> &
  Pick<CartLineProps, "emptyCartFocusId" | "headingLevel">;

/** Список рядків кошика зі стору Hydrogen: спільний для бічної панелі та сторінки /cart. */
export function CartLines({ emptyCartFocusId, headingLevel, className, ...props }: CartLinesProps) {
  const form = useCartForm();
  const lines = useCart((state) => state.data.lines.nodes);
  const pendingLines = useCart((state) => state.pending.lines);
  const lineErrors = useCart((state) => state.errors.lines);

  return (
    <ItemGroup asChild className={cn("gap-0 divide-y divide-line", className)}>
      <ul role="list" data-slot="cart-lines" {...props}>
        {lines.map((line) => (
          <CartLine
            key={line.id}
            line={line}
            form={form}
            pending={pendingLines.has(line.id)}
            error={lineErrorMessage(lineErrors.get(line.id))}
            emptyCartFocusId={emptyCartFocusId}
            headingLevel={headingLevel}
          />
        ))}
      </ul>
    </ItemGroup>
  );
}
