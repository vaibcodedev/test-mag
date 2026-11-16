import { cva, type VariantProps } from "class-variance-authority";

export const priceVariants = cva("", {
  variants: {
    size: {
      /** Картка товару: 22. */
      card: "text-price",
      /** Сторінка товару: 32. */
      lg: "text-price text-(length:--size-h2-panel)",
      /** Hero-банер: 40. */
      hero: "text-price text-(length:--size-h2)",
    },
    tone: {
      default: "text-ink",
      sale: "text-sale",
      "on-dark": "text-surface",
    },
  },
  defaultVariants: {
    size: "card",
    tone: "default",
  },
});

export const priceCompareVariants = cva("line-through", {
  variants: {
    size: {
      card: "text-small",
      lg: "text-body",
      hero: "text-body",
    },
    onDark: {
      true: "text-on-ink-muted",
      false: "text-muted-foreground",
    },
  },
  defaultVariants: { size: "card", onDark: false },
});

export type PriceVariants = Pick<VariantProps<typeof priceVariants>, "size">;
