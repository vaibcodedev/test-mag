import { cva, type VariantProps } from "class-variance-authority";

/**
 * Кнопки й поля, зведені в один контур: сусідні межі зливаються, радіус md лишається
 * тільки на зовнішніх кутах. Горизонтальна група має висоту поля — 46px.
 * Межа дітей за замовчуванням кольору line; залитій кнопці додайте border-transparent.
 */
export const buttonGroupVariants = cva(
  "group/button-group inline-flex w-fit items-stretch rounded-md bg-surface [&>*]:border [&>*:focus-visible]:relative [&>*:focus-visible]:z-10 [&>input]:min-w-0",
  {
    variants: {
      orientation: {
        horizontal:
          "h-11.5 [&>*]:h-full [&>*:not(:first-child)]:rounded-s-none [&>*:not(:first-child)]:border-s-0 [&>*:not(:last-child)]:rounded-e-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
);

export type ButtonGroupVariants = VariantProps<typeof buttonGroupVariants>;
