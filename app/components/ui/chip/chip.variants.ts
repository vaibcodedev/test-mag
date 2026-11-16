import { cva, type VariantProps } from "class-variance-authority";

export const chipVariants = cva(
  "inline-flex h-7 w-fit shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-caption whitespace-nowrap tabular-nums [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        /** На білій картці. */
        page: "bg-page text-ink-2",
        /** На тлі сторінки. */
        surface: "bg-surface text-ink-2",
        /** На ink: характеристики в hero. */
        "on-dark": "bg-on-ink-10 text-surface",
      },
    },
    defaultVariants: {
      tone: "page",
    },
  },
);

export type ChipVariants = VariantProps<typeof chipVariants>;
