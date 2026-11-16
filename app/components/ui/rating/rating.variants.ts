import { cva } from "class-variance-authority";

/** Зірка 16px: заповнена жовта або порожня в кольорі тла (світлого чи ink). */
export const ratingStarVariants = cva("size-4", {
  variants: {
    filled: { true: "fill-star text-star", false: "" },
    onDark: { true: "", false: "" },
  },
  compoundVariants: [
    { filled: false, onDark: false, class: "fill-line text-line" },
    { filled: false, onDark: true, class: "fill-on-ink-20 text-on-ink-20" },
  ],
  defaultVariants: { filled: true, onDark: false },
});

/** Числова оцінка поруч із зірками. */
export const ratingValueVariants = cva("font-semibold tabular-nums", {
  variants: { onDark: { true: "text-surface", false: "text-ink" } },
  defaultVariants: { onDark: false },
});

/** Кількість відгуків у дужках. */
export const ratingCountVariants = cva("tabular-nums", {
  variants: { onDark: { true: "text-on-ink-muted", false: "text-muted-foreground" } },
  defaultVariants: { onDark: false },
});
