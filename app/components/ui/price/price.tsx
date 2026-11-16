import type { ComponentProps } from "react";

import { formatPrice, isOnSale, savings, type Money } from "~/lib/format";
import { cn } from "~/lib/utils";

import { priceCompareVariants, priceVariants, type PriceVariants } from "./price.variants";

export type PriceProps = Omit<ComponentProps<"div">, "children"> &
  PriceVariants & {
    price: Money;
    /** Стара ціна. Якщо вона не вища за поточну, знижка не показується. */
    compareAt?: Money | null;
    /** Підпис «Економія N ₴» під ціною зі знижкою. */
    showSavings?: boolean;
    /** «від» перед ціною, коли в товару кілька варіантів. */
    from?: boolean;
    /** Ціна на ink-тлі. */
    onDark?: boolean;
  };

export function Price({
  price,
  compareAt,
  size = "card",
  showSavings = true,
  from = false,
  onDark = false,
  className,
  ...props
}: PriceProps) {
  const onSale = isOnSale(price, compareAt);
  const saved = onSale ? savings(price, compareAt) : null;
  const tone = onSale ? "sale" : onDark ? "on-dark" : "default";

  return (
    <div data-slot="price" className={cn("flex flex-col gap-0.5", className)} {...props}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={priceVariants({ size, tone })}>
          <span className="sr-only">{onSale ? "Ціна зі знижкою: " : "Ціна: "}</span>
          {from ? "від " : null}
          {formatPrice(price)}
        </span>
        {onSale ? (
          <s className={priceCompareVariants({ size, onDark })}>
            <span className="sr-only">Стара ціна: </span>
            {formatPrice(compareAt)}
          </s>
        ) : null}
      </div>
      {saved && showSavings ? (
        <span className="text-caption font-semibold text-sale">Економія {formatPrice(saved)}</span>
      ) : null}
    </div>
  );
}
